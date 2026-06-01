import { describe, expect, it } from "vitest";
import { calcTeamEntropy } from "./layer6-entropy";
import { calcHHI, calcHHINormalized } from "./layer7-hhi";

describe("Capa 6 — Team Entropy Index", () => {
  it("reparto equitativo → H_norm = 1", () => {
    expect(calcTeamEntropy([10, 10])).toBeCloseTo(1, 10);
    expect(calcTeamEntropy([10, 10, 10, 10, 10])).toBeCloseTo(1, 10);
  });

  it("reparto desigual → 0 < H_norm < 1", () => {
    const h = calcTeamEntropy([90, 10]);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThan(1);
    expect(h).toBeCloseTo(0.468996, 5);
  });

  it("filtra ceros y exige n>=2", () => {
    expect(calcTeamEntropy([10, 10, 0])).toBeCloseTo(1, 10);
    expect(calcTeamEntropy([5])).toBe(0);
    expect(calcTeamEntropy([])).toBe(0);
  });
});

describe("Capa 7 — HHI Coaching Index", () => {
  it("HHI crudo = Σ share²", () => {
    expect(calcHHI([10, 10])).toBeCloseTo(0.5, 10);
    expect(calcHHI([90, 10])).toBeCloseTo(0.82, 10);
    expect(calcHHI([100])).toBeCloseTo(1, 10);
  });

  it("HHI normalizado: equitativo=0, concentrado→1", () => {
    expect(calcHHINormalized([10, 10])).toBeCloseTo(0, 10);
    expect(calcHHINormalized([90, 10])).toBeCloseTo(0.64, 10);
  });

  it("guards: vacío → 0 ; n<2 normalizado → 0", () => {
    expect(calcHHI([])).toBe(0);
    expect(calcHHINormalized([100])).toBe(0);
  });
});
