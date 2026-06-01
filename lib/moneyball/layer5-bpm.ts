/**
 * CAPA 5 — BPM (Box Plus/Minus) simplificado y VORP.
 *
 * Coeficientes: aproximación calibrada con datos NBA históricos. Las "Rate" son tasas por
 * posesión (no porcentajes de rebote); los coeficientes ya reflejan esa escala.
 */
import type { PlayerStats } from "@/types/metrics";
import { safeDiv, avgMinutes, clamp } from "./layer0-raw";
import { calcEFG } from "./layer1-shooting";

/** Nivel de un jugador "replacement-level" en la escala BPM. */
export const REPLACEMENT_BPM = -2.0;

export function calcBPM(stats: PlayerStats, poss: number): number {
  if (poss === 0 || stats.fga === 0) return 0;
  const efg = calcEFG(stats);
  const astRate = safeDiv(stats.ast, poss);
  const tovRate = safeDiv(stats.tov, poss);
  const orebRate = safeDiv(stats.oreb, poss);
  const drebRate = safeDiv(stats.dreb, poss);
  const stlRate = safeDiv(stats.stl, poss);
  const blkRate = safeDiv(stats.blk, poss);
  return (
    2.34 * efg +
    3.48 * astRate +
    -2.95 * tovRate +
    1.32 * orebRate +
    0.85 * drebRate +
    2.1 * stlRate +
    1.52 * blkRate
  );
}

/**
 * VORP (Value Over Replacement Player) — aproximación.
 *
 * VORP estándar = (BPM - replacement) * (% de minutos del equipo) * (partidos / temporada).
 * Sin minutos de equipo se aproxima el % de minutos como avgMin/40 (un titular full = 1.0),
 * y la fracción de temporada como gp/seasonGames. Documentado como heurística en ESTADO.md.
 */
export function calcVORP(
  bpm: number,
  stats: PlayerStats,
  seasonGames = 40,
): number {
  if (stats.gp === 0) return 0;
  const minuteShare = clamp(avgMinutes(stats) / 40, 0, 1);
  const seasonFraction = clamp(stats.gp / seasonGames, 0, 1);
  return (bpm - REPLACEMENT_BPM) * minuteShare * seasonFraction;
}
