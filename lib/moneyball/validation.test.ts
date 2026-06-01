/**
 * Validación de la aritmética contra (a) la definición canónica de las fórmulas y
 * (b) una línea estadística real documentada.
 *
 * Objetivo (pedido del consejo / escéptico de dominio): probar que TS%, eFG%, 3PAr y FTr
 * coinciden con las fórmulas publicadas de Basketball-Reference, para dar credibilidad.
 */
import { describe, expect, it } from "vitest";
import { calc3PAr, calcEFG, calcFTr, calcTS } from "./layer1-shooting";
import type { PlayerStats } from "@/types/metrics";

/**
 * Stephen Curry — temporada 2015-16 (MVP unánime), totales de Basketball-Reference:
 * G 79 · FG 805 · FGA 1597 · 3P 402 · 3PA 886 · FT 363 · FTA 400 · PTS 2375.
 * Valores avanzados publicados: TS% .669 · eFG% .630 · 3PAr .555 · FTr .250.
 * Tolerancia 2 decimales para absorber el redondeo de la fuente.
 */
const CURRY_1516: PlayerStats = {
  pts: 2375,
  fgm: 805,
  fga: 1597,
  threePm: 402,
  threePa: 886,
  ftm: 363,
  fta: 400,
  ast: 527,
  oreb: 68,
  dreb: 362,
  stl: 169,
  blk: 15,
  tov: 262,
  pf: 161,
  min: 2700,
  gp: 79,
};

describe("Validación contra jugador real (Curry 2015-16, Basketball-Reference)", () => {
  it("TS% ≈ .669", () => {
    expect(calcTS(CURRY_1516)).toBeCloseTo(0.669, 2);
  });
  it("eFG% ≈ .630", () => {
    expect(calcEFG(CURRY_1516)).toBeCloseTo(0.63, 2);
  });
  it("3PAr ≈ .555", () => {
    expect(calc3PAr(CURRY_1516)).toBeCloseTo(0.555, 2);
  });
  it("FTr ≈ .250", () => {
    expect(calcFTr(CURRY_1516)).toBeCloseTo(0.25, 2);
  });
});

describe("Identidad de fórmula (precisión exacta, independiente del redondeo de la fuente)", () => {
  it("eFG% == (FGM + 0.5*3PM) / FGA exacto", () => {
    expect(calcEFG(CURRY_1516)).toBeCloseTo((805 + 0.5 * 402) / 1597, 10);
  });
  it("TS% == PTS / (2*(FGA + 0.44*FTA)) exacto", () => {
    expect(calcTS(CURRY_1516)).toBeCloseTo(2375 / (2 * (1597 + 0.44 * 400)), 10);
  });
});
