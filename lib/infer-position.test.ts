import { describe, expect, it } from "vitest";
import { inferPosition } from "./infer-position";
import type { PlayerStats } from "@/types/metrics";

function mk(p: Partial<PlayerStats>): PlayerStats {
  return {
    pts: 0, fgm: 0, fga: 100, threePm: 0, threePa: 0, ftm: 0, fta: 0,
    ast: 0, oreb: 0, dreb: 0, stl: 0, blk: 0, tov: 0, pf: 0, min: 1000, gp: 30,
    ...p,
  };
}

describe("inferPosition", () => {
  it("perfil interior (muchos rebotes + tapones, sin triples) → Pívot", () => {
    const s = mk({ fga: 300, threePa: 2, oreb: 120, dreb: 250, blk: 60, ast: 30, tov: 80 });
    expect(inferPosition(s)).toBe("Pívot");
  });

  it("base puro (muchas asistencias) → Base", () => {
    const s = mk({ fga: 380, threePa: 200, oreb: 20, dreb: 90, blk: 5, ast: 220, tov: 90 });
    expect(inferPosition(s)).toBe("Base");
  });

  it("tirador (muchos triples, pocas asistencias) → Escolta", () => {
    const s = mk({ fga: 380, threePa: 320, oreb: 15, dreb: 80, blk: 4, ast: 50, tov: 50 });
    expect(inferPosition(s)).toBe("Escolta");
  });

  it("perfil de perímetro mixto → Alero/Escolta/Ala-Pívot (estimación ambigua, no Base/Pívot)", () => {
    const s = mk({ fga: 350, threePa: 120, oreb: 45, dreb: 150, blk: 18, ast: 90, tov: 80 });
    const pos = inferPosition(s);
    // El punto es que NO lo clasifique como Base puro ni Pívot puro.
    expect(["Alero", "Escolta", "Ala-Pívot"]).toContain(pos);
  });

  it("ala-pívot (rebotes altos + algún triple) → Ala-Pívot o Pívot", () => {
    const s = mk({ fga: 300, threePa: 90, oreb: 70, dreb: 200, blk: 45, ast: 70, tov: 70 });
    expect(["Ala-Pívot", "Pívot"]).toContain(inferPosition(s));
  });

  it("stats degeneradas (sin posesiones) → Alero (fallback, no lanza)", () => {
    expect(inferPosition(mk({ fga: 0, fta: 0, oreb: 0, tov: 0 }))).toBe("Alero");
  });
});
