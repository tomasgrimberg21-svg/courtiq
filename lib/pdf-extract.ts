/**
 * Heurística PURA para detectar datos de un jugador desde el TEXTO de un PDF.
 *
 * Honestidad: sin IA, la extracción es best-effort. Busca etiquetas conocidas (PTS, REB…)
 * seguidas de un número, y un nombre tras "Nombre/Jugador/Player". Lo detectado PRELLENA el
 * formulario para que el usuario revise y corrija — nunca se guarda automáticamente.
 */
import type { PlayerStats } from "@/types/metrics";

export interface PdfDetection {
  name?: string;
  team?: string;
  league?: string;
  season?: string;
  age?: number;
  stats: Partial<PlayerStats>;
  /** Cuántos campos de stats se detectaron (para informar confianza al usuario). */
  detectedCount: number;
}

/** Claves numéricas de PlayerStats (excluye leagueOrigin que es string). */
type NumericStatKey = Exclude<keyof PlayerStats, "leagueOrigin">;

const STAT_LABELS: { keys: string[]; field: NumericStatKey }[] = [
  { keys: ["gp", "pj", "partidos", "games", "juegos"], field: "gp" },
  { keys: ["min", "minutos", "minutes", "mpg"], field: "min" },
  { keys: ["pts", "puntos", "points", "ppg"], field: "pts" },
  { keys: ["fgm", "fgc", "tcc"], field: "fgm" },
  { keys: ["fga", "fgi", "tci"], field: "fga" },
  { keys: ["3pm", "3pc", "t3c", "triplesc"], field: "threePm" },
  { keys: ["3pa", "3pi", "t3i", "triplesi"], field: "threePa" },
  { keys: ["ftm", "tlc", "libresc"], field: "ftm" },
  { keys: ["fta", "tli", "libresi"], field: "fta" },
  { keys: ["ast", "asistencias", "assists", "apg"], field: "ast" },
  { keys: ["oreb", "rebo", "or"], field: "oreb" },
  { keys: ["dreb", "rebd", "dr"], field: "dreb" },
  { keys: ["stl", "robos", "steals"], field: "stl" },
  { keys: ["blk", "tapones", "blocks"], field: "blk" },
  { keys: ["tov", "perdidas", "turnovers", "to"], field: "tov" },
  { keys: ["pf", "faltas", "fouls"], field: "pf" },
];

const NUM = "([0-9]+(?:[.,][0-9]+)?)";

function toNum(raw: string): number {
  return Number(raw.replace(",", "."));
}

/** Detecta "etiqueta <sep> número" para una lista de alias. Devuelve el primer match válido. */
function findLabeled(text: string, keys: string[]): number | undefined {
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // etiqueta seguida (con :, =, espacios o tab) de un número
    const re = new RegExp(`(?:^|[^a-z0-9])${esc}[\\s:=]+${NUM}`, "i");
    const m = text.match(re);
    if (m && m[1] !== undefined) {
      const n = toNum(m[1]);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return undefined;
}

// Etiquetas que, si aparecen tras un valor de texto, indican el inicio del próximo campo.
const STOP_WORDS = [
  "equipo", "team", "club", "liga", "league", "temporada", "season", "edad", "age",
  "nombre", "jugador", "player", "name", "posicion", "posición", "position",
];

/** Recorta un valor de texto al toparse con la próxima etiqueta conocida (evita "Juan Equipo"). */
function trimAtNextLabel(value: string): string {
  let out = value;
  for (const w of STOP_WORDS) {
    const re = new RegExp(`\\s+${w}\\b.*$`, "i");
    out = out.replace(re, "");
  }
  return out.trim().replace(/\s{2,}/g, " ");
}

function findName(text: string): string | undefined {
  const re = /(?:nombre|jugador|player|name)\s*[:\-]\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ.''\- ]{3,40})/i;
  const m = text.match(re);
  if (m && m[1]) {
    const cleaned = trimAtNextLabel(m[1]);
    if (cleaned.length >= 3) return cleaned;
  }
  return undefined;
}

function findLabeledText(text: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`(?:^|[^a-z])${key}\\s*[:\\-]\\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ.''\\- ]{2,40})`, "i");
    const m = text.match(re);
    if (m && m[1]) {
      const cleaned = trimAtNextLabel(m[1]);
      if (cleaned.length >= 2) return cleaned;
    }
  }
  return undefined;
}

function findSeason(text: string): string | undefined {
  const m = text.match(/\b(20\d{2})\s*[\/\-]\s*(\d{2,4})\b/);
  return m ? `${m[1]}/${m[2]!.slice(-2)}` : undefined;
}

function findAge(text: string): number | undefined {
  const n = findLabeled(text, ["edad", "age", "años"]);
  return n && n >= 14 && n <= 55 ? Math.round(n) : undefined;
}

// --- Detección de TABLA (múltiples jugadores) ---

/** Una fila de tabla detectada: nombre + stats por columna. */
export interface TableRowDetection {
  name: string;
  stats: Partial<PlayerStats>;
}

/** Completa stats parciales con ceros (faltantes = 0). gp default 1 para no romper cálculos. */
export function fillStats(partial: Partial<PlayerStats>): PlayerStats {
  return {
    pts: partial.pts ?? 0, fgm: partial.fgm ?? 0, fga: partial.fga ?? 0,
    threePm: partial.threePm ?? 0, threePa: partial.threePa ?? 0,
    ftm: partial.ftm ?? 0, fta: partial.fta ?? 0, ast: partial.ast ?? 0,
    oreb: partial.oreb ?? 0, dreb: partial.dreb ?? 0, stl: partial.stl ?? 0,
    blk: partial.blk ?? 0, tov: partial.tov ?? 0, pf: partial.pf ?? 0,
    min: partial.min ?? 0, gp: partial.gp && partial.gp > 0 ? partial.gp : 1,
    salary: partial.salary,
  };
}

const HEADER_TOKEN: Record<string, NumericStatKey> = {
  gp: "gp", pj: "gp", min: "min", pts: "pts",
  fgm: "fgm", fga: "fga", "3pm": "threePm", "3pa": "threePa",
  ftm: "ftm", fta: "fta", ast: "ast", oreb: "oreb", dreb: "dreb",
  reb: "dreb", stl: "stl", blk: "blk", tov: "tov", pf: "pf",
};

/** Tokeniza una línea por espacios/tabs, colapsando múltiples separadores. */
function tokenize(line: string): string[] {
  return line.trim().split(/[\s\t]+/).filter(Boolean);
}

/** ¿Es un token numérico (incluye decimales con , o .)? */
function isNum(tok: string): boolean {
  return /^[0-9]+([.,][0-9]+)?$/.test(tok);
}

/**
 * Detecta una tabla de jugadores: una línea de encabezado con ≥3 etiquetas conocidas, seguida de
 * filas "nombre + N números". Mapea números a campos por orden de columna. Best-effort, nunca lanza.
 */
export function extractPlayersTable(raw: string): TableRowDetection[] {
  const text = raw.replace(/[   ]/g, " ");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Buscar la línea de encabezado: la que tiene más tokens mapeables a stats (mínimo 3).
  let headerIdx = -1;
  let headerFields: (NumericStatKey | null)[] = [];
  for (let i = 0; i < lines.length; i++) {
    const toks = tokenize(lines[i]!).map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const fields = toks.map((t) => HEADER_TOKEN[t] ?? null);
    const known = fields.filter(Boolean).length;
    if (known >= 2 && known > headerFields.filter(Boolean).length) {
      headerIdx = i;
      headerFields = fields;
    }
  }
  if (headerIdx === -1) return [];

  // Posiciones (en la lista de tokens del header) que son stats, en orden.
  const statCols = headerFields
    .map((f, idx) => ({ f, idx }))
    .filter((x) => x.f) as { f: NumericStatKey; idx: number }[];

  const minNums = Math.max(1, Math.min(2, statCols.length));
  const out: TableRowDetection[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const toks = tokenize(lines[i]!);
    const nums = toks.filter(isNum);
    if (nums.length < minNums) continue; // no parece fila de datos

    // Nombre = tokens iniciales no numéricos.
    const nameToks: string[] = [];
    for (const t of toks) {
      if (isNum(t)) break;
      nameToks.push(t);
    }
    const name = nameToks.join(" ").trim();
    if (name.length < 2) continue;

    // Asigna números a campos por orden. Los números aparecen tras el nombre.
    const stats: Partial<PlayerStats> = {};
    statCols.forEach((col, k) => {
      const raw2 = nums[k];
      if (raw2 === undefined) return;
      const n = Number(raw2.replace(",", "."));
      if (Number.isFinite(n) && n >= 0) stats[col.f] = n;
    });

    if (Object.keys(stats).length >= minNums) out.push({ name, stats });
  }
  return out;
}

/** Extrae lo que pueda del texto de un PDF. Nunca lanza. */
export function extractStatsFromText(raw: string): PdfDetection {
  const text = raw.replace(/ /g, " ");
  const stats: Partial<PlayerStats> = {};
  let detectedCount = 0;

  for (const { keys, field } of STAT_LABELS) {
    const val = findLabeled(text, keys);
    if (val !== undefined) {
      stats[field] = val;
      detectedCount++;
    }
  }

  return {
    name: findName(text),
    team: findLabeledText(text, ["equipo", "team", "club"]),
    league: findLabeledText(text, ["liga", "league"]),
    season: findSeason(text),
    age: findAge(text),
    stats,
    detectedCount,
  };
}
