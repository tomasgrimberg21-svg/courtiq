/**
 * Persistencia local (localStorage) para rosters guardados y watchlist.
 *
 * Funciona ya sin backend. Cuando Supabase está configurado, `saveRoster` además hace
 * write-through best-effort a `saved_rosters` (multi-dispositivo). SSR-safe (guards de window).
 */
import type { Player, Position } from "@/types/player";
import type { MBPVIWeights } from "@/types/metrics";
import { DEFAULT_MBPVI_WEIGHTS, setActiveWeights, setSalaryEnabled } from "@/lib/moneyball";

const ROSTERS_KEY = "courtiq.rosters";
const WATCH_KEY = "courtiq.watchlist";
const PLAYERS_KEY = "courtiq.players";
const WEIGHTS_KEY = "courtiq.weights";
const NOTES_KEY = "courtiq.notes";
const SALARY_KEY = "courtiq.salaryEnabled";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / modo privado → no-op */
  }
}

function id(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2)}`;
}

// --- Pub/sub para useSyncExternalStore (stores reactivos sin setState-in-effect) ---

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Sincroniza entre pestañas: un cambio en otra pestaña reescribe localStorage.
  const onStorage = () => emit();
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function emit(): void {
  rostersSnapshot = null;
  watchSnapshot = null;
  playersSnapshot = null;
  weightsSnapshot = null;
  notesSnapshot = null;
  salarySnapshot = null;
  for (const l of listeners) l();
}

// Snapshots cacheados: useSyncExternalStore exige identidad estable entre renders.
let rostersSnapshot: SavedRoster[] | null = null;
let watchSnapshot: WatchEntry[] | null = null;
let playersSnapshot: Player[] | null = null;
const EMPTY_ROSTERS: SavedRoster[] = [];
const EMPTY_WATCH: WatchEntry[] = [];
const EMPTY_PLAYERS: Player[] = [];

/** Snapshot estable de rosters para useSyncExternalStore. SSR → array vacío constante. */
export function getRostersSnapshot(): SavedRoster[] {
  if (typeof window === "undefined") return EMPTY_ROSTERS;
  if (rostersSnapshot === null) rostersSnapshot = listRosters();
  return rostersSnapshot;
}

/** Snapshot estable de watchlist para useSyncExternalStore. */
export function getWatchSnapshot(): WatchEntry[] {
  if (typeof window === "undefined") return EMPTY_WATCH;
  if (watchSnapshot === null) watchSnapshot = listWatch();
  return watchSnapshot;
}

/** Snapshot estable de jugadores cargados manualmente para useSyncExternalStore. */
export function getPlayersSnapshot(): Player[] {
  if (typeof window === "undefined") return EMPTY_PLAYERS;
  if (playersSnapshot === null) playersSnapshot = listPlayers();
  return playersSnapshot;
}

// --- Rosters guardados ---

export interface SavedRoster {
  id: string;
  name: string;
  slots: Partial<Record<Position, string>>;
  createdAt: string;
}

export function listRosters(): SavedRoster[] {
  return read<SavedRoster[]>(ROSTERS_KEY, []);
}

export function saveRoster(name: string, slots: Partial<Record<Position, string>>): SavedRoster {
  const roster: SavedRoster = { id: id(), name: name.trim() || "Quinteto sin nombre", slots, createdAt: new Date().toISOString() };
  write(ROSTERS_KEY, [roster, ...listRosters()].slice(0, 50));
  // Write-through best-effort a la base compartida.
  void (async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase().from("rosters").upsert({ id: roster.id, name: roster.name, slots: roster.slots, created_at: roster.createdAt });
    } catch {
      /* sin Supabase → solo local */
    }
  })();
  emit();
  return roster;
}

/** Reemplaza la lista local de rosters (usado al hidratar desde Supabase). */
export function replaceRostersLocal(rosters: SavedRoster[]): void {
  write(ROSTERS_KEY, rosters.slice(0, 50));
  emit();
}

export function deleteRoster(rosterId: string): void {
  write(ROSTERS_KEY, listRosters().filter((r) => r.id !== rosterId));
  void (async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase().from("rosters").delete().eq("id", rosterId);
    } catch {
      /* sin Supabase → solo local */
    }
  })();
  emit();
}

// --- Watchlist (seguimiento + alerta UV) ---

export interface WatchEntry {
  player: Player;
  addedUv: number;
  addedAt: string;
}

export function listWatch(): WatchEntry[] {
  return read<WatchEntry[]>(WATCH_KEY, []);
}

export function isWatched(playerId: string): boolean {
  return listWatch().some((w) => w.player.id === playerId);
}

export function addWatch(player: Player, currentUv: number): void {
  if (isWatched(player.id)) return;
  const entry: WatchEntry = { player, addedUv: currentUv, addedAt: new Date().toISOString() };
  write(WATCH_KEY, [entry, ...listWatch()].slice(0, 100));
  emit();
}

export function removeWatch(playerId: string): void {
  write(WATCH_KEY, listWatch().filter((w) => w.player.id !== playerId));
  emit();
}

// --- Jugadores cargados manualmente ---

export function listPlayers(): Player[] {
  return read<Player[]>(PLAYERS_KEY, []);
}

/** Id estable derivado de nombre+liga+temporada → re-importar la misma planilla NO duplica. */
export function stablePlayerId(name: string, league: string, season: string): string {
  const slug = `${name}|${league}|${season}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `manual-${slug}`;
}

export interface ImportSummary {
  added: number;
  updated: number;
}

/**
 * Importa un lote de jugadores con dedup por id estable (nombre+liga+temporada).
 * Si ya existe, lo actualiza en vez de duplicar. Un solo emit() al final (eficiente para 289+).
 */
export function importPlayers(rows: Array<Omit<Player, "id">>): ImportSummary {
  const existing = listPlayers();
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const pid = stablePlayerId(row.name, row.league, row.season);
    if (byId.has(pid)) updated++;
    else added++;
    byId.set(pid, { ...row, id: pid, origin: "manual", lastUpdated: now });
  }

  const merged = [...byId.values()].slice(0, 1000);
  write(PLAYERS_KEY, merged);
  // Write-through best-effort por lotes a Supabase (no bloquea la UI).
  void pushPlayersBatch(merged.filter((p) => rows.some((r) => stablePlayerId(r.name, r.league, r.season) === p.id)));
  emit();
  return { added, updated };
}

/** Sube jugadores a Supabase en tandas (evita 289 requests en paralelo). Best-effort. */
async function pushPlayersBatch(players: Player[]): Promise<void> {
  if (players.length === 0) return;
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const sb = supabase();
    const CHUNK = 100;
    for (let i = 0; i < players.length; i += CHUNK) {
      const chunk = players.slice(i, i + CHUNK).map((p) => ({ id: p.id, data: p, updated_at: p.lastUpdated }));
      await sb.from("players").upsert(chunk);
    }
  } catch {
    /* sin Supabase → solo local */
  }
}

export function getPlayer(playerId: string): Player | null {
  return listPlayers().find((p) => p.id === playerId) ?? null;
}

/** Crea/actualiza un jugador manual (upsert por id). Genera id si no viene. */
export function savePlayer(player: Omit<Player, "id"> & { id?: string }): Player {
  const full: Player = {
    ...player,
    id: player.id ?? `manual-${id()}`,
    origin: "manual",
    lastUpdated: new Date().toISOString(),
  };
  upsertPlayerLocal(full);
  // Write-through best-effort a la base compartida (cuando Supabase está configurado).
  void (async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase().from("players").upsert({ id: full.id, data: full, updated_at: full.lastUpdated });
    } catch {
      /* sin Supabase → solo local */
    }
  })();
  emit();
  return full;
}

/** Upsert SOLO en localStorage (sin tocar Supabase). Usado por la sincronización de bajada. */
export function upsertPlayerLocal(player: Player): void {
  const others = listPlayers().filter((p) => p.id !== player.id);
  write(PLAYERS_KEY, [player, ...others].slice(0, 500));
}

/** Reemplaza toda la lista local de jugadores (usado al hidratar desde Supabase). */
export function replacePlayersLocal(players: Player[]): void {
  write(PLAYERS_KEY, players.slice(0, 500));
  emit();
}

export function deletePlayer(playerId: string): void {
  write(PLAYERS_KEY, listPlayers().filter((p) => p.id !== playerId));
  // Borrado best-effort en la base compartida.
  void (async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase().from("players").delete().eq("id", playerId);
    } catch {
      /* sin Supabase → solo local */
    }
  })();
  emit();
}

// --- Pesos del modelo MBPVI (calibración del usuario) ---

function validWeights(v: unknown): v is MBPVIWeights {
  if (!v || typeof v !== "object") return false;
  const w = v as Record<string, unknown>;
  return (["w1", "w2", "w3", "w4", "w5", "w6"] as const).every(
    (k) => typeof w[k] === "number" && Number.isFinite(w[k]) && (w[k] as number) >= 0,
  );
}

let weightsSnapshot: MBPVIWeights | null = null;

export function getWeights(): MBPVIWeights {
  const raw = read<unknown>(WEIGHTS_KEY, null);
  return validWeights(raw) ? raw : { ...DEFAULT_MBPVI_WEIGHTS };
}

/** Snapshot estable para useSyncExternalStore. */
export function getWeightsSnapshot(): MBPVIWeights {
  if (typeof window === "undefined") return DEFAULT_MBPVI_WEIGHTS;
  if (weightsSnapshot === null) weightsSnapshot = getWeights();
  return weightsSnapshot;
}

export function saveWeights(w: MBPVIWeights): void {
  write(WEIGHTS_KEY, w);
  setActiveWeights(w); // propaga al integrador para que toda la app recalcule
  emit();
}

export function resetWeights(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(WEIGHTS_KEY);
    } catch {
      /* no-op */
    }
  }
  setActiveWeights(DEFAULT_MBPVI_WEIGHTS);
  emit();
}

/** Aplica los pesos guardados al integrador (llamar una vez al montar la app en cliente). */
export function hydrateWeights(): void {
  if (typeof window === "undefined") return;
  setActiveWeights(getWeights());
}

// --- Interruptor de análisis de sueldos ---

let salarySnapshot: boolean | null = null;

/** Lee el flag de sueldos (true por defecto: análisis activado). */
export function getSalaryEnabledPref(): boolean {
  const raw = read<unknown>(SALARY_KEY, null);
  return raw === false ? false : true;
}

/** Snapshot estable para useSyncExternalStore. */
export function getSalarySnapshot(): boolean {
  if (typeof window === "undefined") return true;
  if (salarySnapshot === null) salarySnapshot = getSalaryEnabledPref();
  return salarySnapshot;
}

export function setSalaryEnabledPref(on: boolean): void {
  write(SALARY_KEY, on);
  setSalaryEnabled(on);
  emit();
}

// --- Notas de scouting (por jugador) ---

export interface ScoutNote {
  text: string;
  tags: string[];
  updatedAt: string;
}

type NotesMap = Record<string, ScoutNote>;

let notesSnapshot: NotesMap | null = null;
const EMPTY_NOTES: NotesMap = {};

function allNotes(): NotesMap {
  return read<NotesMap>(NOTES_KEY, {});
}

/** Snapshot estable de todas las notas para useSyncExternalStore. */
export function getNotesSnapshot(): NotesMap {
  if (typeof window === "undefined") return EMPTY_NOTES;
  if (notesSnapshot === null) notesSnapshot = allNotes();
  return notesSnapshot;
}

export function getNote(playerId: string): ScoutNote | null {
  return allNotes()[playerId] ?? null;
}

/** Guarda/actualiza la nota de un jugador. Texto vacío + sin tags → borra la nota. */
export function saveNote(playerId: string, text: string, tags: string[]): void {
  const map = allNotes();
  const cleanText = text.trim();
  const cleanTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 12);
  if (!cleanText && cleanTags.length === 0) {
    delete map[playerId];
  } else {
    map[playerId] = { text: cleanText, tags: cleanTags, updatedAt: new Date().toISOString() };
  }
  write(NOTES_KEY, map);
  emit();
}

// --- Gestión de datos ---

/** Borra TODOS los datos locales (jugadores, rosters, watchlist, notas). Irreversible. */
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PLAYERS_KEY);
    window.localStorage.removeItem(ROSTERS_KEY);
    window.localStorage.removeItem(WATCH_KEY);
    window.localStorage.removeItem(NOTES_KEY);
  } catch {
    /* no-op */
  }
  emit();
}
