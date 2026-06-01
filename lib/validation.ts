/** Esquemas Zod para validar payloads de los API routes. */
import { z } from "zod";

// JSON nunca produce NaN/Infinity, así que z.number() basta.
const num = z.number();

/** Valida un PlayerStats entrante (Capa 0 + contexto). */
export const playerStatsSchema = z.object({
  pts: num,
  fgm: num,
  fga: num,
  threePm: num,
  threePa: num,
  ftm: num,
  fta: num,
  ast: num,
  oreb: num,
  dreb: num,
  stl: num,
  blk: num,
  tov: num,
  pf: num,
  min: num,
  gp: num,
  salary: num.optional(),
  salaryMax: num.optional(),
  leagueOrigin: z.string().max(60).optional(),
});

export const analyzeRequestSchema = z.object({
  stats: playerStatsSchema,
  league: z.string().max(60).optional(),
  salary: num.optional(),
  salaryMax: num.optional(),
  /** Si es false, omite la narrativa IA (solo métricas). */
  narrative: z.boolean().optional(),
});

export const predictRequestSchema = z.object({
  playerId: z.string().max(120).optional(),
  historicalStats: z.array(playerStatsSchema).min(2, "Se requieren ≥2 temporadas"),
});

export const compareRequestSchema = z.object({
  a: z.object({ stats: playerStatsSchema, league: z.string().max(60), name: z.string().max(120).optional() }),
  b: z.object({ stats: playerStatsSchema, league: z.string().max(60), name: z.string().max(120).optional() }),
  toLeague: z.string().max(60).optional(),
  narrative: z.boolean().optional(),
});
