/**
 * Agregación de métricas de un lineup: entropía de minutos (H_norm), HHI normalizado,
 * FF_Score promedio y fortalezas por sector (ataque/defensa/rebote, escala 0–100).
 */
import type { Player } from "@/types/player";
import { analyzePlayer } from "./moneyball/layer8-mbpvi";
import { calcTeamEntropy } from "./moneyball/layer6-entropy";
import { calcHHINormalized } from "./moneyball/layer7-hhi";
import { calcDrebPct } from "./moneyball/layer3-fourfactors";
import { calcPOSS } from "./moneyball/layer2-possessions";
import { avgMinutes, clamp, safeDiv } from "./moneyball/layer0-raw";
import { SALARY_MAX } from "./sample-data";

export interface RosterMetrics {
  /** Entropía de la distribución de minutos (0–1). 1 = reparto equitativo. */
  entropy: number;
  /** HHI normalizado de minutos (0–1). 1 = concentración total. */
  hhi: number;
  /** FF_Score promedio del lineup. */
  ffScoreAvg: number;
  /** Sectores 0–100. */
  attack: number;
  defense: number;
  rebound: number;
  /** MBPVI promedio. */
  mbpviAvg: number;
}

export function computeRosterMetrics(players: Player[]): RosterMetrics | null {
  if (players.length === 0) return null;

  const minutes = players.map((p) => avgMinutes(p.stats));
  const analyses = players.map((p) =>
    analyzePlayer(p.stats, { league: p.league, salaryMax: SALARY_MAX[p.league] }).layers,
  );

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const ffScoreAvg = mean(analyses.map((l) => l.ffScore));
  const mbpviAvg = mean(analyses.map((l) => l.mbpvi));
  const attack = clamp(mean(analyses.map((l) => l.efg)) * 100, 0, 100);
  const defense = clamp(
    mean(players.map((p) => safeDiv(p.stats.stl + p.stats.blk, calcPOSS(p.stats)))) * 400,
    0,
    100,
  );
  const rebound = clamp(mean(players.map((p) => calcDrebPct(p.stats))) * 100, 0, 100);

  return {
    entropy: calcTeamEntropy(minutes),
    hhi: calcHHINormalized(minutes),
    ffScoreAvg,
    attack,
    defense,
    rebound,
    mbpviAvg,
  };
}
