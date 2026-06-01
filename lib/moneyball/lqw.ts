/**
 * League Quality Weight (LQW) — factor de calidad relativa entre ligas (NBA = 1.00).
 * Permite normalizar estadísticas de un jugador entre ligas de distinto nivel.
 */
import type { LeagueInfo, LeagueKey } from "@/types/league";
import { safeDiv } from "./layer0-raw";

export const LQW: Record<string, number> = {
  NBA: 1.0,
  EuroLeague: 0.85,
  ACB: 0.75,
  NBB: 0.55,
  LNB: 0.5,
  "Liga Uruguaya": 0.35,
  "Liga Provincial ARG": 0.25,
};

/** LQW por defecto cuando la liga no está en la tabla (asume nivel LNB). */
export const DEFAULT_LQW = 0.5;

export const LEAGUES: LeagueInfo[] = [
  { key: "NBA", displayName: "NBA", lqw: 1.0, region: "EE.UU." },
  { key: "EuroLeague", displayName: "EuroLeague", lqw: 0.85, region: "Europa" },
  { key: "ACB", displayName: "Liga ACB", lqw: 0.75, region: "España" },
  { key: "NBB", displayName: "NBB", lqw: 0.55, region: "Brasil" },
  { key: "LNB", displayName: "LNB Argentina", lqw: 0.5, region: "Argentina" },
  { key: "Liga Uruguaya", displayName: "Liga Uruguaya", lqw: 0.35, region: "Uruguay" },
  { key: "Liga Provincial ARG", displayName: "Liga Provincial", lqw: 0.25, region: "Argentina" },
];

export function getLQW(league: string): number {
  return LQW[league] ?? DEFAULT_LQW;
}

export function getLeagueInfo(league: LeagueKey): LeagueInfo | undefined {
  return LEAGUES.find((l) => l.key === league);
}

/**
 * Normaliza un valor estadístico desde una liga de origen hacia una liga objetivo.
 * Un jugador que rinde X en una liga más fuerte "vale" más al proyectarlo a una más débil.
 */
export function normalizeStat(stat: number, fromLeague: string, toLeague = "LNB"): number {
  const lqwFrom = getLQW(fromLeague);
  const lqwTo = getLQW(toLeague);
  return stat * safeDiv(lqwFrom, lqwTo);
}

/** Bonus de procedencia para el MBPVI: el LQW crudo de la liga de origen (0–1). */
export function lqwBonus(league?: string): number {
  return league ? getLQW(league) : 0;
}
