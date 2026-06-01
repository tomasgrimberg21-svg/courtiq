/**
 * CAPA 4 — TPI (Total Performance Index) normalizado por 40 minutos.
 *
 * tpiOff = PTS + AST + OREB - TOV - (FGA-FGM) - (FTA-FTM)
 * tpiDef = STL + BLK + DREB - PF
 * TPI    = (tpiOff + tpiDef) * (40 / minutos_promedio)
 */
import type { PlayerStats } from "@/types/metrics";
import { avgMinutes } from "./layer0-raw";

export function calcTPI(stats: PlayerStats): number {
  const avgMin = avgMinutes(stats);
  if (avgMin === 0) return 0;
  const fgaMissed = stats.fga - stats.fgm;
  const ftaMissed = stats.fta - stats.ftm;
  const tpiOff = stats.pts + stats.ast + stats.oreb - stats.tov - fgaMissed - ftaMissed;
  const tpiDef = stats.stl + stats.blk + stats.dreb - stats.pf;
  return (tpiOff + tpiDef) * (40 / avgMin);
}
