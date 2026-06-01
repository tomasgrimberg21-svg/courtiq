/**
 * Exportación de jugadores a CSV. Función PURA y testeable.
 * El formato coincide con el que acepta `parsePlayersCsv` (round-trip import/export).
 */
import type { Player } from "@/types/player";

const COLUMNS: { header: string; get: (p: Player) => string | number }[] = [
  { header: "nombre", get: (p) => p.name },
  { header: "equipo", get: (p) => p.team },
  { header: "liga", get: (p) => p.league },
  { header: "posicion", get: (p) => p.position },
  { header: "temporada", get: (p) => p.season },
  { header: "edad", get: (p) => p.age ?? "" },
  { header: "gp", get: (p) => p.stats.gp },
  { header: "min", get: (p) => p.stats.min },
  { header: "pts", get: (p) => p.stats.pts },
  { header: "fgm", get: (p) => p.stats.fgm },
  { header: "fga", get: (p) => p.stats.fga },
  { header: "3pm", get: (p) => p.stats.threePm },
  { header: "3pa", get: (p) => p.stats.threePa },
  { header: "ftm", get: (p) => p.stats.ftm },
  { header: "fta", get: (p) => p.stats.fta },
  { header: "ast", get: (p) => p.stats.ast },
  { header: "oreb", get: (p) => p.stats.oreb },
  { header: "dreb", get: (p) => p.stats.dreb },
  { header: "stl", get: (p) => p.stats.stl },
  { header: "blk", get: (p) => p.stats.blk },
  { header: "tov", get: (p) => p.stats.tov },
  { header: "pf", get: (p) => p.stats.pf },
  { header: "salario", get: (p) => p.stats.salary ?? "" },
];

/** Escapa un valor para CSV: comillas si contiene coma, comilla o salto de línea. */
export function escapeCsv(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Serializa una lista de jugadores a CSV (con encabezados). */
export function playersToCsv(players: Player[]): string {
  const head = COLUMNS.map((c) => c.header).join(",");
  const rows = players.map((p) => COLUMNS.map((c) => escapeCsv(c.get(p))).join(","));
  return [head, ...rows].join("\n");
}
