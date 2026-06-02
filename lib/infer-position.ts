/**
 * Inferencia de posición a partir del perfil estadístico (heurística, testeable).
 *
 * Las planillas de la LNB/Liga Argentina NO traen la posición. En vez de poner todo en "Alero"
 * (inservible para filtrar), inferimos una posición plausible de las tasas por posesión:
 *   - mucho rebote + tapones, poco triple  → Pívot / Ala-Pívot
 *   - mucha asistencia + triples            → Base / Escolta
 *   - perfil intermedio                     → Alero
 *
 * Es una ESTIMACIÓN, no un dato. El usuario debería revisarla. Por eso la confianza del import
 * se mantiene media-alta pero no total.
 */
import type { PlayerStats } from "@/types/metrics";
import type { Position } from "@/types/player";
import { calcPOSS } from "./moneyball/layer2-possessions";
import { safeDiv } from "./moneyball/layer0-raw";

export function inferPosition(stats: PlayerStats): Position {
  const poss = calcPOSS(stats);
  if (poss <= 0) return "Alero";

  const reb = stats.oreb + stats.dreb;
  const rebRate = safeDiv(reb, poss);
  const blkRate = safeDiv(stats.blk, poss);
  const astRate = safeDiv(stats.ast, poss);
  const threeRate = safeDiv(stats.threePa, stats.fga); // 3PAr
  const orebShare = safeDiv(stats.oreb, reb || 1);

  // Score "interior" (big) vs "exterior" (guard). Cuanto más positivo, más interior.
  const big =
    rebRate * 3.0 +
    blkRate * 8.0 +
    orebShare * 1.5 -
    threeRate * 3.0 -
    astRate * 4.0;

  // Score "playmaker" (base puro): asistencias altas.
  const playmaker = astRate * 5.0 + threeRate * 0.5;

  if (big > 1.3) return "Pívot";
  if (big > 0.7) return "Ala-Pívot";
  if (playmaker > 1.4) return "Base";
  if (threeRate > 0.45 && astRate < 0.18) return "Escolta";
  if (playmaker > 0.9) return "Escolta";
  return "Alero";
}
