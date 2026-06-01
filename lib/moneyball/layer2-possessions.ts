/**
 * CAPA 2 — Posesiones y ratings.
 * POSS (posesiones estimadas), ORtg, DRtg, NRtg.
 */
import type { PlayerStats } from "@/types/metrics";
import { safeDiv } from "./layer0-raw";

/** Posesiones estimadas: FGA - OREB + TOV + 0.44 * FTA. */
export function calcPOSS(stats: PlayerStats): number {
  return stats.fga - stats.oreb + stats.tov + 0.44 * stats.fta;
}

/** Offensive Rating: puntos producidos por 100 posesiones. */
export function calcORtg(pts: number, poss: number): number {
  return safeDiv(pts, poss) * 100;
}

/** Defensive Rating: puntos cedidos por 100 posesiones del rival. */
export function calcDRtg(oppPts: number, oppPoss: number): number {
  return safeDiv(oppPts, oppPoss) * 100;
}

/** Net Rating: ORtg - DRtg. */
export function calcNRtg(ortg: number, drtg: number): number {
  return ortg - drtg;
}
