import { describe, expect, it } from "vitest";
import {
  analyzePlayer,
  calcMBPVI,
  calcUVScore,
  getUVCategory,
  normalizeNRtg,
  normalizeSalary,
  normalizeTPI,
} from "./layer8-mbpvi";
import { SIMPLE } from "./fixtures";

describe("Capa 8 — normalizadores", () => {
  it("normalizeTPI: clamp [0,1] con techo 40", () => {
    expect(normalizeTPI(40)).toBe(1);
    expect(normalizeTPI(80)).toBe(1);
    expect(normalizeTPI(-10)).toBe(0);
    expect(normalizeTPI(20)).toBe(0.5);
  });

  it("normalizeNRtg: mapea [-20,20] → [0,1]", () => {
    expect(normalizeNRtg(0)).toBe(0.5);
    expect(normalizeNRtg(20)).toBe(1);
    expect(normalizeNRtg(-20)).toBe(0);
    expect(normalizeNRtg(40)).toBe(1); // clamp
  });

  it("normalizeSalary: salary/salaryMax, 0 si falta dato", () => {
    expect(normalizeSalary(50, 100)).toBe(0.5);
    expect(normalizeSalary(undefined, 100)).toBe(0);
    expect(normalizeSalary(50, undefined)).toBe(0);
  });
});

describe("Capa 8 — MBPVI y UV_Score", () => {
  it("calcMBPVI: suma ponderada pura (todos los inputs = 1)", () => {
    // 0.28 + 0.22 + 0.20 + 0.12 - 0.10 + 0.08 = 0.80
    expect(calcMBPVI(1, 1, 1, 1, 1, 1)).toBeCloseTo(0.8, 10);
    expect(calcMBPVI(0, 0, 0, 0, 0, 0)).toBe(0);
  });

  it("calcUVScore = MBPVI / salaryNorm, 0 sin salario", () => {
    expect(calcUVScore(1.5, 0.5)).toBe(3);
    expect(calcUVScore(2, 0)).toBe(0);
  });

  it("getUVCategory: semáforo por umbrales", () => {
    expect(getUVCategory(3).label).toBe("OBJETIVO PRIORITARIO");
    expect(getUVCategory(2).label).toBe("BUENA INVERSIÓN");
    expect(getUVCategory(1).label).toBe("PRECIO JUSTO");
    expect(getUVCategory(0.5).label).toBe("SOBREVALORADO");
    expect(getUVCategory(3).emoji).toBe("🟢");
  });
});

describe("Capa 8 — integrador analyzePlayer", () => {
  it("corre todas las capas y normaliza componentes", () => {
    const { layers, uvCategory } = analyzePlayer(SIMPLE);
    expect(layers.efg).toBe(0.55);
    expect(layers.tpi).toBe(30);
    expect(layers.tpiNorm).toBe(0.75);
    expect(layers.nrtg).toBe(0); // sin opponent → neutral
    // mbpvi = 0.28*0.75 + 0.22*0.5 + 0.20*0.600478 + 0.12*0.5 = 0.500096
    expect(layers.mbpvi).toBeCloseTo(0.500096, 5);
    expect(layers.uvScore).toBe(0); // sin salario
    expect(uvCategory.label).toBe("SOBREVALORADO"); // uv=0
  });

  it("con salario: penaliza MBPVI y calcula UV_Score", () => {
    const withSalary = { ...SIMPLE, salary: 50 };
    const { layers } = analyzePlayer(withSalary, { salaryMax: 100 });
    // mbpvi = 0.500096 - 0.10*0.5 = 0.450096 ; uv = mbpvi/0.5
    expect(layers.mbpvi).toBeCloseTo(0.450096, 5);
    expect(layers.uvScore).toBeCloseTo(0.900191, 5);
  });

  it("usa opponent para NRtg cuando se provee", () => {
    const { layers } = analyzePlayer(SIMPLE, { opponent: { pts: 100, poss: 110 } });
    expect(layers.drtg).toBeCloseTo(90.909, 2);
    expect(layers.nrtg).not.toBe(0);
  });
});
