import type { Player, Position } from "./player";

/** Arquetipos de jugador para el armador de roster. */
export type Archetype =
  | "Creador"
  | "Tirador"
  | "Slasher"
  | "Defensor Perimetral"
  | "Reboteador"
  | "Protector de Aro"
  | "Stretch Big"
  | "Glue Guy";

export interface RosterSlot {
  position: Position;
  player: Player | null;
}

export interface TeamMetrics {
  /** Índice de entropía del equipo (H_norm, 0–1). */
  entropy: number;
  /** HHI de distribución de minutos (0–1). */
  hhi: number;
  /** FF_Score promedio del lineup. */
  ffScoreAvg: number;
  /** Net rating agregado estimado. */
  nrtgAvg: number;
}

export interface Team {
  id: string;
  name: string;
  league: string;
  roster: RosterSlot[];
  metrics?: TeamMetrics;
}
