/**
 * CAPA 6 — Team Entropy Index (H_norm).
 *
 * Mide qué tan distribuida está una magnitud (minutos, uso, puntos) entre los jugadores.
 * Entropía de Shannon normalizada por log(n):
 *   H = -Σ p_i * ln(p_i),  H_norm = H / ln(n)  ∈ [0,1]
 * H_norm = 1 → reparto perfectamente equitativo; H_norm → 0 → todo concentrado en un jugador.
 */
import { safeDiv } from "./layer0-raw";

/**
 * @param weights pesos no negativos (p.ej. minutos por jugador). Se normalizan internamente.
 * @returns H_norm en [0,1]. Devuelve 0 si hay menos de 2 jugadores o suma 0.
 */
export function calcTeamEntropy(weights: number[]): number {
  const positive = weights.filter((w) => w > 0);
  const n = positive.length;
  if (n < 2) return 0;
  const total = positive.reduce((acc, w) => acc + w, 0);
  if (total === 0) return 0;

  let h = 0;
  for (const w of positive) {
    const p = w / total;
    h -= p * Math.log(p);
  }
  return safeDiv(h, Math.log(n));
}
