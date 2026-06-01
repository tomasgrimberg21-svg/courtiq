/**
 * CAPA 8 — MBPVI_ARG (integrador final) + UV_Score.
 *
 * `calcMBPVI` es la suma ponderada PURA del spec (testeable con valores conocidos).
 * El integrador `analyzePlayer` corre las capas 1–8 y normaliza cada componente a escalas
 * comparables [0,1] antes de alimentar el MBPVI, para que NRtg (~±20) no domine sobre FF_Score (~0–1).
 * Las constantes de normalización son heurísticas de calibración (ajustables con datos reales).
 */
import type { LayerResults, MBPVIWeights, PlayerStats, UVCategory } from "@/types/metrics";
import { clamp, safeDiv } from "./layer0-raw";
import { calc3PAr, calcEFG, calcFTr, calcTS } from "./layer1-shooting";
import { calcDRtg, calcNRtg, calcORtg, calcPOSS } from "./layer2-possessions";
import { calcFFScore } from "./layer3-fourfactors";
import { calcTPI } from "./layer4-tpi";
import { calcBPM, calcVORP } from "./layer5-bpm";
import { lqwBonus } from "./lqw";

export const DEFAULT_MBPVI_WEIGHTS: MBPVIWeights = {
  w1: 0.28,
  w2: 0.22,
  w3: 0.2,
  w4: 0.12,
  w5: 0.1,
  w6: 0.08,
};

/**
 * Pesos "activos" a nivel de módulo: permiten que el usuario calibre el modelo desde la UI sin
 * threadear `weights` por cada call site. `analyzePlayer` usa `opts.weights ?? ACTIVE_WEIGHTS`.
 * SSR: en el servidor siempre quedan en DEFAULT (la calibración es una preferencia del cliente).
 * Los tests no lo modifican → siguen usando DEFAULT.
 */
let ACTIVE_WEIGHTS: MBPVIWeights = { ...DEFAULT_MBPVI_WEIGHTS };

export function setActiveWeights(w: MBPVIWeights): void {
  ACTIVE_WEIGHTS = { ...w };
}

export function getActiveWeights(): MBPVIWeights {
  return ACTIVE_WEIGHTS;
}

export function resetActiveWeights(): void {
  ACTIVE_WEIGHTS = { ...DEFAULT_MBPVI_WEIGHTS };
}

/**
 * Interruptor del análisis de sueldos. Cuando está apagado, el MBPVI ignora el salario
 * (sin penalización) y el UV_Score queda en 0 (no medible) → la app rankea por MBPVI puro.
 * Útil cuando no se tiene el dato salarial o se quiere evaluar rendimiento aislado.
 */
let SALARY_ENABLED = true;

export function setSalaryEnabled(on: boolean): void {
  SALARY_ENABLED = on;
}

export function getSalaryEnabled(): boolean {
  return SALARY_ENABLED;
}

// --- Constantes de normalización (heurísticas, ver ESTADO.md) ---
const TPI_NORM_CEIL = 40; // TPI per-40 "elite" de referencia
const NRTG_RANGE = 20; // |NRtg| esperable; mapea [-20,20] → [0,1]

/** Normaliza TPI a [0,1] con techo de referencia. */
export function normalizeTPI(tpi: number): number {
  return clamp(safeDiv(tpi, TPI_NORM_CEIL), 0, 1);
}

/** Normaliza NRtg a [0,1]: (NRtg + range) / (2*range). */
export function normalizeNRtg(nrtg: number): number {
  return clamp((nrtg + NRTG_RANGE) / (2 * NRTG_RANGE), 0, 1);
}

/** Salario normalizado a [0,1] = salary / salaryMax. */
export function normalizeSalary(salary?: number, salaryMax?: number): number {
  if (!salary || !salaryMax) return 0;
  return clamp(safeDiv(salary, salaryMax), 0, 1);
}

/**
 * MBPVI — índice integrador (suma ponderada pura). Todos los inputs deben venir ya normalizados a [0,1].
 */
export function calcMBPVI(
  tpiNorm: number,
  nrtgNorm: number,
  ffScore: number,
  hNorm: number,
  salaryNorm: number,
  lqwBonusValue: number,
  weights: MBPVIWeights = DEFAULT_MBPVI_WEIGHTS,
): number {
  return (
    weights.w1 * tpiNorm +
    weights.w2 * nrtgNorm +
    weights.w3 * ffScore +
    weights.w4 * hNorm -
    weights.w5 * salaryNorm +
    weights.w6 * lqwBonusValue
  );
}

/** UV_Score = MBPVI / salaryNorm. Devuelve 0 si no hay info de salario (no es subvaloración medible). */
export function calcUVScore(mbpvi: number, salaryNorm: number): number {
  if (salaryNorm <= 0) return 0;
  return mbpvi / salaryNorm;
}

/** Semáforo de subvaloración a partir del UV_Score. */
export function getUVCategory(uvScore: number): UVCategory {
  if (uvScore > 2.5) return { label: "OBJETIVO PRIORITARIO", color: "#00ff87", emoji: "🟢", tone: "green" };
  if (uvScore >= 1.5) return { label: "BUENA INVERSIÓN", color: "#ffd700", emoji: "🟡", tone: "gold" };
  if (uvScore >= 0.8) return { label: "PRECIO JUSTO", color: "#888888", emoji: "⚪", tone: "white" };
  return { label: "SOBREVALORADO", color: "#ff4444", emoji: "🔴", tone: "red" };
}

export interface AnalyzeOptions {
  /** Liga de origen para el bonus LQW. */
  league?: string;
  /** Contexto del rival para DRtg/NRtg. Si se omite, NRtg = 0 (neutral). */
  opponent?: { pts: number; poss: number };
  /** Entropía del equipo (H_norm 0–1). Si se omite, 0.5 (neutral). */
  teamEntropy?: number;
  /** Techo salarial de la liga para normalizar; cae a `stats.salaryMax` si existe. */
  salaryMax?: number;
  /** Partidos de la temporada para VORP. */
  seasonGames?: number;
  weights?: MBPVIWeights;
  /** Override del interruptor de sueldos (por defecto usa el flag de módulo). */
  salaryEnabled?: boolean;
}

/**
 * Corre TODAS las capas sobre un jugador y devuelve resultados + UV_Score + categoría.
 * Punto de entrada principal de la librería para la UI y `/api/analyze`.
 */
export function analyzePlayer(
  stats: PlayerStats,
  opts: AnalyzeOptions = {},
): { layers: LayerResults; uvCategory: UVCategory } {
  const poss = calcPOSS(stats);

  // Capa 1
  const ts = calcTS(stats);
  const efg = calcEFG(stats);
  const threePAr = calc3PAr(stats);
  const ftr = calcFTr(stats);

  // Capa 2
  const ortg = calcORtg(stats.pts, poss);
  const drtg = opts.opponent ? calcDRtg(opts.opponent.pts, opts.opponent.poss) : 0;
  const nrtg = opts.opponent ? calcNRtg(ortg, drtg) : 0;

  // Capa 3
  const ffScore = calcFFScore(stats, poss);

  // Capa 4
  const tpi = calcTPI(stats);
  const tpiNorm = normalizeTPI(tpi);

  // Capa 5
  const bpm = calcBPM(stats, poss);
  const vorp = calcVORP(bpm, stats, opts.seasonGames);

  // Capa 8
  const teamEntropy = opts.teamEntropy ?? 0.5;
  // Si el análisis de sueldos está apagado (o se fuerza por opts), salaryNorm=0:
  // sin penalización en el MBPVI y UV_Score = 0 (no medible).
  const salaryOn = opts.salaryEnabled ?? SALARY_ENABLED;
  const salaryNorm = salaryOn ? normalizeSalary(stats.salary, opts.salaryMax ?? stats.salaryMax) : 0;
  const bonus = lqwBonus(opts.league ?? stats.leagueOrigin);
  const mbpvi = calcMBPVI(
    tpiNorm,
    normalizeNRtg(nrtg),
    ffScore,
    teamEntropy,
    salaryNorm,
    bonus,
    opts.weights ?? ACTIVE_WEIGHTS,
  );
  const uvScore = calcUVScore(mbpvi, salaryNorm);

  return {
    layers: {
      ts,
      efg,
      threePAr,
      ftr,
      poss,
      ortg,
      drtg,
      nrtg,
      ffScore,
      tpi,
      tpiNorm,
      bpm,
      vorp,
      mbpvi,
      uvScore,
    },
    uvCategory: getUVCategory(uvScore),
  };
}
