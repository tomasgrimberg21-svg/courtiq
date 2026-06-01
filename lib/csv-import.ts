/**
 * Importación de jugadores desde CSV/TSV pegado.
 *
 * Parser PURO y testeable (sin UI). Tolera comas o tabs como separador, comillas, y mapea
 * encabezados flexibles (alias en español/inglés) a los campos de PlayerStats.
 * Filosofía: validar y reportar errores por fila; nunca inventar datos.
 */
import type { PlayerStats } from "@/types/metrics";
import type { Player, Position } from "@/types/player";

export interface ParsedRow {
  /** 1-based, incluye fila de encabezado en el conteo para mensajes claros. */
  line: number;
  player?: Omit<Player, "id">;
  error?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  ok: ParsedRow[];
  failed: ParsedRow[];
}

// --- Mapeo de encabezados → campos ---

type StatKey = keyof PlayerStats;
type FieldTarget = StatKey | "name" | "team" | "league" | "season" | "position" | "age" | "reb" | "salary";

const HEADER_ALIASES: Record<string, FieldTarget> = {
  // identidad
  nombre: "name", name: "name", jugador: "name", player: "name",
  equipo: "team", team: "team", club: "team",
  liga: "league", league: "league",
  temporada: "season", season: "season",
  posicion: "position", "posición": "position", position: "position", pos: "position",
  edad: "age", age: "age",
  salario: "salary", salary: "salary", salaryusd: "salary", sueldo: "salary",
  // volumen
  gp: "gp", pj: "gp", partidos: "gp", g: "gp", games: "gp",
  min: "min", minutos: "min", minutes: "min",
  // tiro
  pts: "pts", puntos: "pts", points: "pts",
  fgm: "fgm", fgc: "fgm",
  fga: "fga", fgi: "fga",
  "3pm": "threePm", threepm: "threePm", t3c: "threePm", triplesc: "threePm",
  "3pa": "threePa", threepa: "threePa", t3i: "threePa", triplesi: "threePa",
  ftm: "ftm", tlc: "ftm", libresc: "ftm",
  fta: "fta", tli: "fta", libresi: "fta",
  // juego
  ast: "ast", asistencias: "ast", assists: "ast",
  oreb: "oreb", rebo: "oreb", oreb_: "oreb",
  dreb: "dreb", rebd: "dreb",
  reb: "reb", rebotes: "reb", trb: "reb",
  stl: "stl", robos: "stl", steals: "stl",
  blk: "blk", tapones: "blk", blocks: "blk",
  tov: "tov", perdidas: "tov", "pérdidas": "tov", to: "tov",
  pf: "pf", faltas: "pf", fouls: "pf",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[%.\s]+/g, "");
}

/** Divide una línea respetando comillas dobles. Soporta separador , o tab. */
export function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Detecta el separador dominante en la primera línea (tab gana si aparece). */
export function detectSeparator(headerLine: string): string {
  if (headerLine.includes("\t")) return "\t";
  return ",";
}

const POSITION_MAP: [RegExp, Position][] = [
  [/base|point|\bpg\b|\b1\b/i, "Base"],
  [/escolta|shooting|\bsg\b|\b2\b/i, "Escolta"],
  [/ala-?p|power|\bpf\b|\b4\b/i, "Ala-Pívot"],
  [/p[ií]vot|center|\bc\b|\b5\b/i, "Pívot"],
  [/alero|small|\bsf\b|forward|\b3\b/i, "Alero"],
];

function mapPosition(raw?: string): Position {
  if (!raw) return "Alero";
  for (const [re, p] of POSITION_MAP) if (re.test(raw)) return p;
  return "Alero";
}

const STAT_KEYS: (keyof PlayerStats)[] = [
  "pts", "fgm", "fga", "threePm", "threePa", "ftm", "fta",
  "ast", "oreb", "dreb", "stl", "blk", "tov", "pf", "min", "gp",
];

function emptyStats(): PlayerStats {
  return {
    pts: 0, fgm: 0, fga: 0, threePm: 0, threePa: 0, ftm: 0, fta: 0,
    ast: 0, oreb: 0, dreb: 0, stl: 0, blk: 0, tov: 0, pf: 0, min: 0, gp: 0,
  };
}

/**
 * Parsea un bloque CSV/TSV completo. Primera línea = encabezados.
 * Devuelve filas con `player` (válido) o `error` (qué falló), sin lanzar.
 */
export function parsePlayersCsv(text: string, defaults?: { league?: string; season?: string }): ParseResult {
  const rows: ParsedRow[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [{ line: 1, error: "Se necesita al menos una fila de encabezados y una de datos." }], ok: [], failed: [] };
  }

  const sep = detectSeparator(lines[0]!);
  const headers = splitLine(lines[0]!, sep).map(normalizeHeader);
  const mapped = headers.map((h) => HEADER_ALIASES[h]);

  if (!mapped.includes("name")) {
    return { rows: [{ line: 1, error: "Falta la columna de nombre (acepta: nombre, name, jugador, player)." }], ok: [], failed: [] };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = i + 1;
    const cells = splitLine(lines[i]!, sep);
    const stats = emptyStats();
    let name = "";
    let team = "—";
    let league = defaults?.league ?? "LNB";
    let season = defaults?.season ?? "—";
    let position: Position = "Alero";
    let age: number | undefined;
    let rebTotal: number | null = null;
    let rowError: string | undefined;

    mapped.forEach((field, idx) => {
      if (!field) return;
      const raw = (cells[idx] ?? "").trim();
      if (field === "name") name = raw;
      else if (field === "team") team = raw || "—";
      else if (field === "league") league = raw || league;
      else if (field === "season") season = raw || season;
      else if (field === "position") position = mapPosition(raw);
      else if (field === "age") {
        const n = Number(raw);
        if (raw && Number.isFinite(n)) age = n;
      } else if (field === "reb") {
        const n = Number(raw.replace(",", "."));
        if (raw && Number.isFinite(n) && n >= 0) rebTotal = n;
      } else {
        // campo numérico de stats
        const n = Number(raw.replace(",", "."));
        if (raw === "") return;
        if (!Number.isFinite(n) || n < 0) {
          rowError = `Valor inválido en "${headers[idx]}": "${raw}"`;
          return;
        }
        // field aquí es una stat numérica; los campos string (leagueOrigin) nunca llegan acá.
        (stats as unknown as Record<string, number>)[field] = n;
      }
    });

    // Reparte rebote total si no vinieron OREB/DREB explícitos.
    if (rebTotal !== null && stats.oreb === 0 && stats.dreb === 0) {
      stats.oreb = Math.round(rebTotal * 0.25 * 10) / 10;
      stats.dreb = Math.round(rebTotal * 0.75 * 10) / 10;
    }

    if (rowError) {
      rows.push({ line, error: rowError });
      continue;
    }
    if (!name) {
      rows.push({ line, error: "Fila sin nombre." });
      continue;
    }
    if (stats.gp <= 0) {
      rows.push({ line, error: `"${name}": GP (partidos) debe ser > 0.` });
      continue;
    }
    if (stats.fgm > stats.fga || stats.threePm > stats.threePa || stats.ftm > stats.fta) {
      rows.push({ line, error: `"${name}": convertidos no pueden superar intentados.` });
      continue;
    }

    rows.push({
      line,
      player: {
        name,
        team,
        league,
        season,
        position,
        age,
        stats,
        statsBasis: "season",
        origin: "manual",
        confidence: 1,
      },
    });
  }

  return {
    rows,
    ok: rows.filter((r) => r.player),
    failed: rows.filter((r) => r.error),
  };
}

/** Cabecera CSV de ejemplo para mostrar al usuario. */
export const CSV_TEMPLATE =
  "nombre,equipo,liga,posicion,gp,min,pts,fgm,fga,3pm,3pa,ftm,fta,ast,oreb,dreb,stl,blk,tov,pf\n" +
  "M. Ejemplo,Mi Club,LNB,Base,40,1200,520,180,400,70,200,80,100,200,40,120,55,8,110,90";

// Aliases ignorables para columnas no usadas: no rompe si el CSV trae extras.
export const KNOWN_HEADERS = STAT_KEYS;
