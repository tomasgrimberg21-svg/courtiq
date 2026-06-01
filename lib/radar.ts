/**
 * Perfil radar de 6 dimensiones (0–100) para el RadarChart del jugador.
 * Las constantes de escala son heurísticas para mapear tasas por posesión a un 0–100 legible.
 */
import type { LayerResults, PlayerStats } from "@/types/metrics";
import { calcPOSS } from "./moneyball/layer2-possessions";
import { clamp, safeDiv } from "./moneyball/layer0-raw";

export interface RadarDimension {
  axis: string;
  value: number; // 0–100
}

export function radarProfile(stats: PlayerStats, layers: LayerResults): RadarDimension[] {
  const poss = layers.poss || calcPOSS(stats);
  const reb = stats.oreb + stats.dreb;
  return [
    { axis: "Tiro (TS%)", value: clamp(layers.ts * 100, 0, 100) },
    { axis: "Eficiencia (eFG%)", value: clamp(layers.efg * 100, 0, 100) },
    { axis: "Rebote", value: clamp(safeDiv(reb, poss) * 250, 0, 100) },
    { axis: "Asistencias", value: clamp(safeDiv(stats.ast, poss) * 300, 0, 100) },
    { axis: "Defensa", value: clamp(safeDiv(stats.stl + stats.blk, poss) * 500, 0, 100) },
    { axis: "Control", value: clamp((1 - safeDiv(stats.tov, poss)) * 100, 0, 100) },
  ];
}
