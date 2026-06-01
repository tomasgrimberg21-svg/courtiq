/**
 * Dataset de MUESTRA (jugadores ficticios) para poblar la UI mientras no haya datos reales
 * desde búsqueda IA + caché Supabase. Totales por temporada. Marcado como "muestra" en la UI.
 */
import type { Player } from "@/types/player";

/** Techo salarial de referencia por liga (USD) para normalizar salaryNorm ∈ [0,1]. */
export const SALARY_MAX: Record<string, number> = {
  NBA: 50_000_000,
  EuroLeague: 4_000_000,
  ACB: 2_000_000,
  NBB: 400_000,
  LNB: 200_000,
  "Liga Uruguaya": 90_000,
  "Liga Provincial ARG": 40_000,
};

export const SAMPLE_PLAYERS: Player[] = [
  {
    id: "base-lnb-dominguez",
    name: "M. Domínguez",
    team: "Instituto",
    league: "LNB",
    season: "2025/26",
    position: "Base",
    age: 24,
    stats: { pts: 520, fgm: 180, fga: 400, threePm: 70, threePa: 200, ftm: 80, fta: 100, ast: 200, oreb: 40, dreb: 120, stl: 55, blk: 8, tov: 110, pf: 90, min: 1200, gp: 40, salary: 70_000 },
    sourceUrl: "muestra://courtiq",
  },
  {
    id: "escolta-lnb-ferreyra",
    name: "T. Ferreyra",
    team: "Quimsa",
    league: "LNB",
    season: "2025/26",
    position: "Escolta",
    age: 27,
    stats: { pts: 640, fgm: 220, fga: 470, threePm: 110, threePa: 280, ftm: 90, fta: 110, ast: 120, oreb: 35, dreb: 130, stl: 48, blk: 12, tov: 95, pf: 85, min: 1250, gp: 40, salary: 150_000 },
    sourceUrl: "muestra://courtiq",
  },
  {
    id: "pivot-nbb-souza",
    name: "R. Souza",
    team: "Flamengo",
    league: "NBB",
    season: "2025/26",
    position: "Pívot",
    age: 29,
    stats: { pts: 540, fgm: 230, fga: 360, threePm: 5, threePa: 20, ftm: 75, fta: 130, ast: 60, oreb: 130, dreb: 280, stl: 30, blk: 70, tov: 90, pf: 110, min: 1100, gp: 38, salary: 220_000 },
    sourceUrl: "muestra://courtiq",
  },
  {
    id: "alero-acb-novak",
    name: "P. Novak",
    team: "Joventut",
    league: "ACB",
    season: "2025/26",
    position: "Alero",
    age: 23,
    stats: { pts: 480, fgm: 165, fga: 360, threePm: 80, threePa: 210, ftm: 70, fta: 90, ast: 90, oreb: 45, dreb: 150, stl: 42, blk: 18, tov: 80, pf: 95, min: 1050, gp: 34, salary: 600_000 },
    sourceUrl: "muestra://courtiq",
  },
  {
    id: "alapivot-euroleague-radic",
    name: "S. Radić",
    team: "Partizan",
    league: "EuroLeague",
    season: "2025/26",
    position: "Ala-Pívot",
    age: 26,
    stats: { pts: 410, fgm: 150, fga: 300, threePm: 45, threePa: 130, ftm: 65, fta: 85, ast: 70, oreb: 70, dreb: 200, stl: 30, blk: 45, tov: 70, pf: 90, min: 980, gp: 32, salary: 2_400_000 },
    sourceUrl: "muestra://courtiq",
  },
  {
    id: "base-uru-pereyra",
    name: "L. Pereyra",
    team: "Aguada",
    league: "Liga Uruguaya",
    season: "2025/26",
    position: "Base",
    age: 21,
    stats: { pts: 430, fgm: 150, fga: 350, threePm: 60, threePa: 180, ftm: 70, fta: 95, ast: 175, oreb: 30, dreb: 95, stl: 50, blk: 6, tov: 100, pf: 80, min: 1080, gp: 36, salary: 35_000 },
    sourceUrl: "muestra://courtiq",
  },
];

export function getSamplePlayer(id: string): Player | undefined {
  return SAMPLE_PLAYERS.find((p) => p.id === id);
}

// --- Histórico de muestra (escalando los totales actuales por temporada) ---
const COUNTING: (keyof PlayerStatsCounting)[] = [
  "pts", "fgm", "fga", "threePm", "threePa", "ftm", "fta", "ast", "oreb", "dreb", "stl", "blk", "tov", "pf", "min",
];
type PlayerStatsCounting = Omit<Player["stats"], "gp" | "salary" | "salaryMax" | "leagueOrigin">;

function scaleSeason(base: Player["stats"], factor: number, gp: number): Player["stats"] {
  const s = { ...base };
  for (const k of COUNTING) s[k] = Math.round(base[k] * factor);
  s.gp = gp;
  return s;
}

function attachHistory(id: string, factors: { season: string; f: number; gp: number }[]): void {
  const p = SAMPLE_PLAYERS.find((x) => x.id === id);
  if (!p) return;
  p.history = factors.map(({ season, f, gp }) =>
    f === 1 ? { season, stats: p.stats } : { season, stats: scaleSeason(p.stats, f, gp) },
  );
}

attachHistory("base-lnb-dominguez", [
  { season: "2023/24", f: 0.74, gp: 38 },
  { season: "2024/25", f: 0.88, gp: 39 },
  { season: "2025/26", f: 1, gp: 40 },
]);
attachHistory("pivot-nbb-souza", [
  { season: "2023/24", f: 1.05, gp: 36 },
  { season: "2024/25", f: 1.0, gp: 37 },
  { season: "2025/26", f: 1, gp: 38 },
]);
