/** Fixtures compartidos por los tests del sistema Moneyball. NO es un archivo de test. */
import type { PlayerStats } from "@/types/metrics";

/**
 * Jugador "simple" con números elegidos para que los cálculos sean verificables a mano.
 * Ver lib/moneyball/*.test.ts para los valores esperados derivados.
 */
export const SIMPLE: PlayerStats = {
  pts: 13,
  fgm: 5,
  fga: 10,
  threePm: 1,
  threePa: 4,
  ftm: 2,
  fta: 4,
  ast: 4,
  oreb: 2,
  dreb: 6,
  stl: 1,
  blk: 1,
  tov: 3,
  pf: 2,
  min: 20,
  gp: 1,
};

/** Todos los campos en cero: ejercita los guards de división por cero en todas las capas. */
export const ZERO: PlayerStats = {
  pts: 0,
  fgm: 0,
  fga: 0,
  threePm: 0,
  threePa: 0,
  ftm: 0,
  fta: 0,
  ast: 0,
  oreb: 0,
  dreb: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
  min: 0,
  gp: 0,
};
