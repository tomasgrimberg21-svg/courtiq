/**
 * CAPA 3 — Four Factors (pesos calibrados para básquet sudamericano / LNB Argentina).
 *
 * Referencia: estudio NBB Brasil — el rebote defensivo (DREB) es más discriminante en ligas
 * de menor ritmo y menor %eFG que en NBA. Pesos ajustados:
 *   eFG 0.35 · DREB% 0.30 (vs ~0.20 NBA) · (1 - TOV%) 0.20 · FTrate 0.15.
 */
import type { PlayerStats } from "@/types/metrics";
import { safeDiv } from "./layer0-raw";
import { calcEFG } from "./layer1-shooting";

/** % de turnovers sobre posesiones. */
export function calcTovPct(stats: PlayerStats, poss: number): number {
  return safeDiv(stats.tov, poss);
}

/** % de rebote defensivo sobre rebotes propios disponibles (aprox. sin OPP_OREB). */
export function calcDrebPct(stats: PlayerStats): number {
  return safeDiv(stats.dreb, stats.oreb + stats.dreb);
}

/**
 * FF_Score — índice compuesto de Four Factors ponderado para LNB.
 * Retorna 0 cuando no hay posesiones ni tiros (guard).
 */
export function calcFFScore(stats: PlayerStats, poss: number): number {
  if (poss === 0 || stats.fga === 0) return 0;
  const efg = calcEFG(stats);
  const tovPct = calcTovPct(stats, poss);
  const drebPct = calcDrebPct(stats);
  const ftRate = safeDiv(stats.ftm, stats.fga); // FT *made* rate, deliberado (no FTA/FGA)
  return 0.35 * efg + 0.3 * drebPct + 0.2 * (1 - tovPct) + 0.15 * ftRate;
}
