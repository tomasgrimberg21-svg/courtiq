/**
 * Tipos del sistema de métricas Moneyball.
 *
 * `PlayerStats` es la unidad de entrada de TODAS las capas (0–8). Los campos de la Capa 0
 * son totales de temporada (no per-game) salvo que se indique; los helpers per-40 / per-game
 * viven en `lib/moneyball/layer0-raw.ts`.
 */

/** Capa 0 — variables base + contexto económico/competitivo. */
export interface PlayerStats {
  // --- Tiro ---
  pts: number;
  fgm: number;
  fga: number;
  threePm: number;
  threePa: number;
  ftm: number;
  fta: number;
  // --- Juego ---
  ast: number;
  oreb: number;
  dreb: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  // --- Volumen ---
  min: number;
  gp: number;
  // --- Contexto (opcional) ---
  /** Salario anual en USD. */
  salary?: number;
  /** Techo salarial de referencia de la liga (USD) para normalizar a [0,1]. */
  salaryMax?: number;
  /** Liga de origen del jugador (clave de la tabla LQW). */
  leagueOrigin?: string;
}

/** Categoría de subvaloración derivada del UV_Score (semáforo). */
export interface UVCategory {
  label: string;
  /** Hex fijo (para el PDF, que no soporta CSS var). */
  color: string;
  emoji: string;
  /** Tono semántico (la UI web lo mapea a CSS var, adaptable a tema). */
  tone: "green" | "gold" | "white" | "red";
}

/** Pesos del integrador MBPVI (Capa 8). Deben sumar ~1 entre los términos positivos. */
export interface MBPVIWeights {
  w1: number; // TPI normalizado
  w2: number; // NRtg
  w3: number; // FF_Score
  w4: number; // Entropía del equipo (H_norm)
  w5: number; // Penalización por salario
  w6: number; // Bonus por liga de origen (LQW)
}

/** Resultado de correr las 8 capas sobre un `PlayerStats`. */
export interface LayerResults {
  // Capa 1
  ts: number;
  efg: number;
  threePAr: number;
  ftr: number;
  // Capa 2
  poss: number;
  ortg: number;
  drtg: number;
  nrtg: number;
  // Capa 3
  ffScore: number;
  // Capa 4
  tpi: number;
  tpiNorm: number;
  // Capa 5
  bpm: number;
  vorp: number;
  // Capa 8
  mbpvi: number;
  uvScore: number;
}

/** Análisis completo de un jugador (lo que devuelve el endpoint /api/analyze). */
export interface PlayerAnalysis {
  layers: LayerResults;
  uvCategory: UVCategory;
  /** Narrativa generada por IA (se completa en Día 2). */
  narrative?: string;
}
