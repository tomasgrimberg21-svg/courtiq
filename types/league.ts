/** Ligas soportadas (claves de la tabla LQW). */
export type LeagueKey =
  | "NBA"
  | "EuroLeague"
  | "ACB"
  | "NBB"
  | "LNB"
  | "Liga Uruguaya"
  | "Liga Provincial ARG";

export interface LeagueInfo {
  key: LeagueKey;
  /** Nombre legible para UI. */
  displayName: string;
  /** League Quality Weight (0–1, NBA = 1.00). */
  lqw: number;
  /** País / región. */
  region: string;
}
