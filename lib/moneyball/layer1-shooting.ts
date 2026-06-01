/**
 * CAPA 1 — Eficiencia de tiro.
 * TS% (True Shooting), eFG% (Effective FG), 3PAr (3-point Attempt Rate), FTr (FT Rate).
 * Todas retornan 0 cuando el volumen de tiro es 0 (guard vía safeDiv).
 */
import type { PlayerStats } from "@/types/metrics";
import { safeDiv } from "./layer0-raw";

/** True Shooting %: pts / (2 * (FGA + 0.44 * FTA)). Rango natural ~0–1 (a veces >1). */
export function calcTS(stats: PlayerStats): number {
  return safeDiv(stats.pts, 2 * (stats.fga + 0.44 * stats.fta));
}

/** Effective FG %: (FGM + 0.5 * 3PM) / FGA. */
export function calcEFG(stats: PlayerStats): number {
  return safeDiv(stats.fgm + 0.5 * stats.threePm, stats.fga);
}

/** 3-Point Attempt Rate: 3PA / FGA. */
export function calc3PAr(stats: PlayerStats): number {
  return safeDiv(stats.threePa, stats.fga);
}

/** Free Throw Rate: FTA / FGA. */
export function calcFTr(stats: PlayerStats): number {
  return safeDiv(stats.fta, stats.fga);
}
