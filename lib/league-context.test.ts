import { describe, expect, it } from "vitest";
import { percentileOf, leagueContext } from "./league-context";
import { SAMPLE_PLAYERS, getSamplePlayer } from "./sample-data";

describe("percentileOf", () => {
  it("valor máximo → ~100", () => {
    expect(percentileOf(10, [1, 5, 10])).toBeGreaterThanOrEqual(80);
  });
  it("valor mínimo → bajo", () => {
    expect(percentileOf(1, [1, 5, 10])).toBeLessThanOrEqual(20);
  });
  it("mediana → ~50", () => {
    expect(percentileOf(5, [1, 5, 10])).toBe(50);
  });
  it("pool de 1 → 50 (sin comparación)", () => {
    expect(percentileOf(5, [5])).toBe(50);
  });
});

describe("leagueContext", () => {
  it("devuelve contexto por métrica para una liga con ≥2 jugadores", () => {
    // LNB tiene varios en el dataset de muestra.
    const lnb = SAMPLE_PLAYERS.filter((p) => p.league === "LNB");
    expect(lnb.length).toBeGreaterThanOrEqual(2);
    const ctx = leagueContext(lnb[0]!, SAMPLE_PLAYERS);
    expect(ctx.length).toBeGreaterThan(0);
    const uv = ctx.find((c) => c.metric === "uvScore")!;
    expect(uv.sampleSize).toBe(lnb.length);
    expect(uv.percentile).toBeGreaterThanOrEqual(0);
    expect(uv.percentile).toBeLessThanOrEqual(100);
    expect(Number.isFinite(uv.avg)).toBe(true);
  });

  it("liga con un solo jugador → sin contexto", () => {
    const solo = getSamplePlayer("alapivot-euroleague-radic");
    // Si EuroLeague tiene 1 solo en muestra, no hay comparación.
    if (solo && SAMPLE_PLAYERS.filter((p) => p.league === "EuroLeague").length < 2) {
      expect(leagueContext(solo, SAMPLE_PLAYERS)).toEqual([]);
    }
  });
});
