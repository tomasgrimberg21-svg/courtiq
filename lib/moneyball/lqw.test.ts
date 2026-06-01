import { describe, expect, it } from "vitest";
import { DEFAULT_LQW, getLQW, lqwBonus, normalizeStat } from "./lqw";

describe("LQW — League Quality Weights", () => {
  it("getLQW devuelve el peso de la liga o el default", () => {
    expect(getLQW("NBA")).toBe(1.0);
    expect(getLQW("LNB")).toBe(0.5);
    expect(getLQW("Liga Inexistente")).toBe(DEFAULT_LQW);
  });

  it("normalizeStat escala de liga fuerte a débil (sube el valor)", () => {
    // NBA→LNB: factor 1.0/0.5 = 2
    expect(normalizeStat(20, "NBA", "LNB")).toBe(40);
  });

  it("normalizeStat escala de liga débil a fuerte (baja el valor)", () => {
    expect(normalizeStat(20, "LNB", "NBA")).toBe(10);
  });

  it("lqwBonus = LQW de origen, 0 si no hay liga", () => {
    expect(lqwBonus("NBB")).toBe(0.55);
    expect(lqwBonus(undefined)).toBe(0);
  });
});
