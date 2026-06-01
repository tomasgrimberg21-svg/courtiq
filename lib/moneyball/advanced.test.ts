import { describe, expect, it } from "vitest";
import { calcFFScore } from "./layer3-fourfactors";
import { calcTPI } from "./layer4-tpi";
import { calcBPM, calcVORP, REPLACEMENT_BPM } from "./layer5-bpm";
import { calcPOSS } from "./layer2-possessions";
import { SIMPLE, ZERO } from "./fixtures";

describe("Capa 3 — Four Factors (pesos LNB)", () => {
  it("FF_Score con pesos 0.35/0.30/0.20/0.15", () => {
    // eFG 0.55, drebPct 0.75, tovPct 3/12.76, ftMadeRate 0.2
    expect(calcFFScore(SIMPLE, calcPOSS(SIMPLE))).toBeCloseTo(0.600478, 5);
  });

  it("guard: poss=0 → 0", () => {
    expect(calcFFScore(ZERO, 0)).toBe(0);
  });
});

describe("Capa 4 — TPI normalizado por 40'", () => {
  it("TPI = (tpiOff + tpiDef) * (40/avgMin)", () => {
    // tpiOff=9, tpiDef=6, avgMin=20 → 15 * 2 = 30
    expect(calcTPI(SIMPLE)).toBe(30);
  });

  it("guard: gp=0 (avgMin=0) → 0", () => {
    expect(calcTPI(ZERO)).toBe(0);
  });
});

describe("Capa 5 — BPM y VORP", () => {
  it("BPM con coeficientes calibrados", () => {
    expect(calcBPM(SIMPLE, calcPOSS(SIMPLE))).toBeCloseTo(2.574622, 4);
  });

  it("VORP = (BPM - replacement) * minuteShare * seasonFraction", () => {
    const bpm = calcBPM(SIMPLE, calcPOSS(SIMPLE));
    // minuteShare = 20/40 = 0.5 ; seasonFraction = 1/40 = 0.025
    const expected = (bpm - REPLACEMENT_BPM) * 0.5 * 0.025;
    expect(calcVORP(bpm, SIMPLE)).toBeCloseTo(expected, 6);
  });

  it("guard: poss=0 → BPM 0 ; gp=0 → VORP 0", () => {
    expect(calcBPM(ZERO, 0)).toBe(0);
    expect(calcVORP(5, ZERO)).toBe(0);
  });
});
