/**
 * Contexto de liga: compara las métricas de un jugador contra el promedio y el percentil
 * de su liga, usando el pool de jugadores disponible (muestra + cargados).
 *
 * Honesto: el percentil es relativo al pool cargado, no a la liga real completa. Con pocos
 * jugadores es ruidoso — se informa el tamaño de muestra para que el usuario lo pondere.
 */
import type { Player } from "@/types/player";
import type { LayerResults } from "@/types/metrics";
import { analyzePlayer } from "./moneyball";
import { SALARY_MAX } from "./sample-data";

export type ContextMetric = "uvScore" | "mbpvi" | "efg" | "ts" | "bpm" | "tpi" | "ffScore";

export interface MetricContext {
  metric: ContextMetric;
  label: string;
  value: number;
  /** Promedio de la liga (pool). */
  avg: number;
  /** Percentil 0–100 del jugador dentro de su liga. */
  percentile: number;
  /** Cantidad de jugadores de esa liga en el pool (incluye al jugador). */
  sampleSize: number;
}

const METRICS: { metric: ContextMetric; label: string; get: (l: LayerResults) => number }[] = [
  { metric: "uvScore", label: "UV Score", get: (l) => l.uvScore },
  { metric: "mbpvi", label: "MBPVI", get: (l) => l.mbpvi },
  { metric: "efg", label: "eFG%", get: (l) => l.efg },
  { metric: "ts", label: "TS%", get: (l) => l.ts },
  { metric: "bpm", label: "BPM", get: (l) => l.bpm },
  { metric: "tpi", label: "TPI", get: (l) => l.tpi },
  { metric: "ffScore", label: "FF_Score", get: (l) => l.ffScore },
];

function layersOf(p: Player): LayerResults {
  return analyzePlayer(p.stats, { league: p.league, salaryMax: SALARY_MAX[p.league] }).layers;
}

/** Percentil de `value` dentro de `values` (0–100). Empates cuentan como ≤. */
export function percentileOf(value: number, values: number[]): number {
  if (values.length <= 1) return 50;
  const below = values.filter((v) => v < value).length;
  const equal = values.filter((v) => v === value).length;
  // Posición media de los empates (definición estándar de rango percentil).
  return Math.round(((below + 0.5 * equal) / values.length) * 100);
}

/**
 * Contexto de cada métrica del jugador frente a su liga dentro del pool.
 * Devuelve [] si el jugador es el único de su liga en el pool (sin comparación posible).
 */
export function leagueContext(player: Player, pool: Player[]): MetricContext[] {
  const sameLeague = pool.filter((p) => p.league === player.league);
  if (sameLeague.length < 2) return [];

  const poolLayers = sameLeague.map(layersOf);
  const mine = layersOf(player);

  return METRICS.map(({ metric, label, get }) => {
    const values = poolLayers.map(get);
    const value = get(mine);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      metric,
      label,
      value,
      avg,
      percentile: percentileOf(value, values),
      sampleSize: sameLeague.length,
    };
  });
}
