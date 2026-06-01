/**
 * Clasificación de arquetipos de jugador (rule-based, determinística).
 * Puntúa cada arquetipo con tasas por posesión y elige el de mayor score.
 */
import type { Archetype } from "@/types/team";
import type { Player } from "@/types/player";
import { calcPOSS } from "./moneyball/layer2-possessions";
import { calc3PAr, calcEFG } from "./moneyball/layer1-shooting";
import { calcDrebPct } from "./moneyball/layer3-fourfactors";
import { safeDiv } from "./moneyball/layer0-raw";

const ARCHETYPE_COLOR: Record<Archetype, string> = {
  Creador: "#00ff87",
  Tirador: "#ffd700",
  Slasher: "#ff8a3d",
  "Defensor Perimetral": "#3da5ff",
  Reboteador: "#b06bff",
  "Protector de Aro": "#ff5d7a",
  "Stretch Big": "#5dffd0",
  "Glue Guy": "#9aa0b5",
};

export function archetypeColor(a: Archetype): string {
  return ARCHETYPE_COLOR[a];
}

export function classifyArchetype(player: Player): Archetype {
  const s = player.stats;
  const poss = calcPOSS(s);
  const astRate = safeDiv(s.ast, poss);
  const threePAr = calc3PAr(s);
  const efg = calcEFG(s);
  const ftr = safeDiv(s.fta, s.fga);
  const blkRate = safeDiv(s.blk, poss);
  const stlRate = safeDiv(s.stl, poss);
  const rebRate = safeDiv(s.oreb + s.dreb, poss);
  const drebPct = calcDrebPct(s);
  const isBig = player.position === "Pívot" || player.position === "Ala-Pívot";

  const scores: Record<Archetype, number> = {
    Creador: astRate * 3.5,
    Tirador: threePAr * 1.5 + efg * 0.6,
    Slasher: ftr * 2.0 + (1 - threePAr) * 0.5,
    "Defensor Perimetral": stlRate * 5 + (isBig ? 0 : 0.2),
    Reboteador: rebRate * 2.5 + drebPct * 0.5,
    "Protector de Aro": blkRate * 6,
    "Stretch Big": isBig ? threePAr * 2.5 : -1,
    "Glue Guy": 0.5,
  };

  let best: Archetype = "Glue Guy";
  let bestScore = -Infinity;
  for (const key of Object.keys(scores) as Archetype[]) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return best;
}
