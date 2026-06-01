import { describe, expect, it } from "vitest";
import { calc3PAr, calcEFG, calcFTr, calcTS } from "./layer1-shooting";
import { calcDRtg, calcNRtg, calcORtg, calcPOSS } from "./layer2-possessions";
import { SIMPLE, ZERO } from "./fixtures";

describe("Capa 1 — eficiencia de tiro", () => {
  it("TS% = pts / (2*(FGA + 0.44*FTA))", () => {
    // 13 / (2*(10 + 0.44*4)) = 13 / 23.52
    expect(calcTS(SIMPLE)).toBeCloseTo(0.552721, 5);
  });

  it("eFG% = (FGM + 0.5*3PM) / FGA", () => {
    expect(calcEFG(SIMPLE)).toBe(0.55);
  });

  it("3PAr = 3PA / FGA", () => {
    expect(calc3PAr(SIMPLE)).toBe(0.4);
  });

  it("FTr = FTA / FGA", () => {
    expect(calcFTr(SIMPLE)).toBe(0.4);
  });

  it("guard: FGA=0 / FTA=0 → 0 (sin NaN)", () => {
    expect(calcTS(ZERO)).toBe(0);
    expect(calcEFG(ZERO)).toBe(0);
    expect(calc3PAr(ZERO)).toBe(0);
    expect(calcFTr(ZERO)).toBe(0);
  });
});

describe("Capa 2 — posesiones y ratings", () => {
  it("POSS = FGA - OREB + TOV + 0.44*FTA", () => {
    // 10 - 2 + 3 + 1.76 = 12.76
    expect(calcPOSS(SIMPLE)).toBeCloseTo(12.76, 5);
  });

  it("ORtg = pts/poss*100", () => {
    expect(calcORtg(SIMPLE.pts, calcPOSS(SIMPLE))).toBeCloseTo(101.880878, 4);
  });

  it("DRtg = oppPts/oppPoss*100", () => {
    expect(calcDRtg(100, 95)).toBeCloseTo(105.263158, 4);
  });

  it("NRtg = ORtg - DRtg", () => {
    expect(calcNRtg(110, 100)).toBe(10);
  });

  it("guard: poss=0 → ratings 0", () => {
    expect(calcORtg(0, 0)).toBe(0);
    expect(calcDRtg(0, 0)).toBe(0);
    expect(calcPOSS(ZERO)).toBe(0);
  });
});
