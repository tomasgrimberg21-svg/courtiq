import type { PlayerStats, LayerResults, UVCategory } from "./metrics";

export type Position = "Base" | "Escolta" | "Alero" | "Ala-Pívot" | "Pívot";

export interface Player {
  id: string;
  name: string;
  team: string;
  league: string;
  season: string;
  position: Position;
  age?: number;
  /** Estadísticas crudas (Capa 0). */
  stats: PlayerStats;
  /** Métricas calculadas (se llenan tras correr las capas). */
  metrics?: LayerResults;
  uvCategory?: UVCategory;
  /** Procedencia del dato (para mostrar fuente + timestamp). */
  sourceUrl?: string;
  lastUpdated?: string;
  /** Confianza del dato (0–1): combina la confianza del modelo y la completitud de stats. */
  confidence?: number;
  /** Origen del registro: 'sample' (muestra), 'ai' (web search), 'manual'. */
  origin?: "sample" | "ai" | "manual";
  /** Base de las estadísticas: per-game o totales de temporada. */
  statsBasis?: "per-game" | "season";
  /** Histórico por temporada (la última suele coincidir con `stats`). */
  history?: { season: string; stats: PlayerStats }[];
}
