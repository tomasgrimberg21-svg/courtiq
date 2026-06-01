/**
 * CAPA 7 — HHI Coaching Index (Herfindahl-Hirschman Index).
 *
 * Concentración de la distribución de minutos del lineup. HHI = Σ s_i² con s_i = share de cada
 * jugador. HHI alto = rotación corta / dependencia; HHI bajo = reparto amplio.
 * Se expone también la versión normalizada a [0,1] que descuenta el piso 1/n.
 */
import { safeDiv } from "./layer0-raw";

/** HHI crudo: Σ (share_i)². Rango (1/n, 1]. */
export function calcHHI(weights: number[]): number {
  const positive = weights.filter((w) => w > 0);
  const total = positive.reduce((acc, w) => acc + w, 0);
  if (total === 0) return 0;
  return positive.reduce((acc, w) => {
    const share = w / total;
    return acc + share * share;
  }, 0);
}

/** HHI normalizado a [0,1]: (HHI - 1/n) / (1 - 1/n). 0 = reparto equitativo, 1 = concentración total. */
export function calcHHINormalized(weights: number[]): number {
  const positive = weights.filter((w) => w > 0);
  const n = positive.length;
  if (n < 2) return 0;
  const hhi = calcHHI(positive);
  const floor = 1 / n;
  return safeDiv(hhi - floor, 1 - floor);
}
