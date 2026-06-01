/**
 * CAPA 0 — Variables base.
 *
 * Re-exporta el tipo de entrada y expone utilidades numéricas compartidas por todas las capas.
 * Toda división en el sistema pasa por `safeDiv` para garantizar guards de división por cero
 * en un único lugar (anti-patrón prohibido: calcular sin guard).
 */
import type { PlayerStats } from "@/types/metrics";

export type { PlayerStats };

/** División segura: devuelve `fallback` (0 por defecto) cuando el denominador es 0 o no finito. */
export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator)) return fallback;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

/** Acota un valor al rango [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** Minutos promedio por partido (0 si gp = 0). */
export function avgMinutes(stats: PlayerStats): number {
  return safeDiv(stats.min, stats.gp);
}

/** Convierte un total de temporada a promedio por partido. */
export function perGame(total: number, gp: number): number {
  return safeDiv(total, gp);
}
