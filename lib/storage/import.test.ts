/**
 * Tests de importPlayers + stablePlayerId. Mockeamos localStorage para correr en node.
 */
import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock de localStorage en memoria (jsdom no está activo en el runner por defecto).
const store = new Map<string, string>();
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
});

import { importPlayers, listPlayers, stablePlayerId, updatePlayers, deletePlayers } from "./local";
import type { Player } from "@/types/player";

function row(name: string, league = "LNB", season = "2024/25", pts = 100): Omit<Player, "id"> {
  return {
    name, team: "—", league, season, position: "Alero",
    stats: { pts, fgm: 40, fga: 90, threePm: 10, threePa: 30, ftm: 10, fta: 12, ast: 20, oreb: 10, dreb: 30, stl: 8, blk: 3, tov: 15, pf: 20, min: 600, gp: 30 },
  };
}

beforeEach(() => store.clear());

describe("stablePlayerId", () => {
  it("es determinístico para el mismo nombre/liga/temporada", () => {
    expect(stablePlayerId("SABIN, T.", "LNB", "2024/25")).toBe(stablePlayerId("SABIN, T.", "LNB", "2024/25"));
  });
  it("difiere si cambia la temporada", () => {
    expect(stablePlayerId("SABIN, T.", "LNB", "2024/25")).not.toBe(stablePlayerId("SABIN, T.", "LNB", "2023/24"));
  });
  it("normaliza acentos y formato", () => {
    expect(stablePlayerId("Pérez, Á.", "LNB", "2024/25")).toMatch(/^manual-perez/);
  });
});

describe("importPlayers", () => {
  it("agrega jugadores nuevos", () => {
    const r = importPlayers([row("A"), row("B")]);
    expect(r).toEqual({ added: 2, updated: 0 });
    expect(listPlayers()).toHaveLength(2);
  });

  it("re-importar la misma planilla NO duplica (actualiza)", () => {
    importPlayers([row("A", "LNB", "2024/25", 100)]);
    const r = importPlayers([row("A", "LNB", "2024/25", 200)]); // mismo jugador, pts distinto
    expect(r).toEqual({ added: 0, updated: 1 });
    const all = listPlayers();
    expect(all).toHaveLength(1);
    expect(all[0]!.stats.pts).toBe(200); // se actualizó
  });

  it("mismo nombre en distinta temporada → dos jugadores", () => {
    importPlayers([row("A", "LNB", "2024/25")]);
    importPlayers([row("A", "LNB", "2023/24")]);
    expect(listPlayers()).toHaveLength(2);
  });

  it("dedup dentro del mismo lote (última gana)", () => {
    const r = importPlayers([row("A", "LNB", "2024/25", 100), row("A", "LNB", "2024/25", 300)]);
    expect(listPlayers()).toHaveLength(1);
    expect(listPlayers()[0]!.stats.pts).toBe(300);
    // ambas filas resolvieron al mismo id → 1 added, 1 updated
    expect(r.added + r.updated).toBe(2);
  });
});

describe("updatePlayers / deletePlayers (lote)", () => {
  it("aplica un patch de liga/posición a los seleccionados", () => {
    importPlayers([row("A"), row("B"), row("C")]);
    const ids = listPlayers().slice(0, 2).map((p) => p.id);
    const n = updatePlayers(ids, { league: "NBA", position: "Pívot" });
    expect(n).toBe(2);
    const all = listPlayers();
    expect(all.filter((p) => p.league === "NBA")).toHaveLength(2);
    expect(all.filter((p) => p.position === "Pívot")).toHaveLength(2);
    // El tercero quedó intacto.
    expect(all.find((p) => p.league === "LNB")).toBeTruthy();
  });

  it("borra varios por id", () => {
    importPlayers([row("A"), row("B"), row("C")]);
    const ids = listPlayers().slice(0, 2).map((p) => p.id);
    const n = deletePlayers(ids);
    expect(n).toBe(2);
    expect(listPlayers()).toHaveLength(1);
  });

  it("updatePlayers con ids inexistentes no toca nada", () => {
    importPlayers([row("A")]);
    expect(updatePlayers(["no-existe"], { team: "X" })).toBe(0);
    expect(listPlayers()).toHaveLength(1);
  });
});
