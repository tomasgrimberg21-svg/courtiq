import { describe, expect, it } from "vitest";
import { classifyArchetype } from "./archetype";
import { computeRosterMetrics } from "./roster";
import { getSamplePlayer, SAMPLE_PLAYERS } from "./sample-data";

const souza = getSamplePlayer("pivot-nbb-souza")!;
const dominguez = getSamplePlayer("base-lnb-dominguez")!;

describe("classifyArchetype", () => {
  it("pívot reboteador → Reboteador", () => {
    expect(classifyArchetype(souza)).toBe("Reboteador");
  });

  it("base con muchas asistencias → Creador", () => {
    expect(classifyArchetype(dominguez)).toBe("Creador");
  });

  it("siempre devuelve un arquetipo válido para cada muestra", () => {
    for (const p of SAMPLE_PLAYERS) {
      expect(classifyArchetype(p)).toBeTruthy();
    }
  });
});

describe("computeRosterMetrics", () => {
  it("roster vacío → null", () => {
    expect(computeRosterMetrics([])).toBeNull();
  });

  it("1 jugador → entropía y HHI 0 (n<2)", () => {
    const m = computeRosterMetrics([souza])!;
    expect(m.entropy).toBe(0);
    expect(m.hhi).toBe(0);
    expect(m.attack).toBeGreaterThan(0);
  });

  it("≥2 jugadores → métricas en rango", () => {
    const m = computeRosterMetrics(SAMPLE_PLAYERS.slice(0, 5))!;
    expect(m.entropy).toBeGreaterThan(0);
    expect(m.entropy).toBeLessThanOrEqual(1);
    expect(m.hhi).toBeGreaterThanOrEqual(0);
    expect(m.hhi).toBeLessThanOrEqual(1);
    for (const s of [m.attack, m.defense, m.rebound]) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});
