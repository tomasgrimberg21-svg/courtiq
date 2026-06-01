import { describe, expect, it } from "vitest";
import { escapeCsv, playersToCsv } from "./csv-export";
import { parsePlayersCsv } from "./csv-import";
import type { Player } from "@/types/player";

const PLAYER: Player = {
  id: "manual-1",
  name: "A. García",
  team: "Peñarol",
  league: "LNB",
  season: "2025/26",
  position: "Base",
  age: 25,
  stats: {
    pts: 520, fgm: 200, fga: 430, threePm: 80, threePa: 210, ftm: 80, fta: 100,
    ast: 210, oreb: 38, dreb: 125, stl: 52, blk: 9, tov: 100, pf: 88, min: 1300, gp: 42, salary: 70000,
  },
  origin: "manual",
};

describe("escapeCsv", () => {
  it("deja valores simples sin comillas", () => {
    expect(escapeCsv("Peñarol")).toBe("Peñarol");
    expect(escapeCsv(42)).toBe("42");
  });
  it("encierra y escapa valores con coma o comillas", () => {
    expect(escapeCsv("Pérez, Juan")).toBe('"Pérez, Juan"');
    expect(escapeCsv('a"b')).toBe('"a""b"');
  });
});

describe("playersToCsv", () => {
  it("genera encabezado + una fila por jugador", () => {
    const csv = playersToCsv([PLAYER]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("nombre,equipo,liga");
    expect(lines[1]).toContain("A. García");
  });

  it("round-trip: export → import reconstruye las stats", () => {
    const csv = playersToCsv([PLAYER]);
    const back = parsePlayersCsv(csv);
    expect(back.ok).toHaveLength(1);
    const p = back.ok[0]!.player!;
    expect(p.name).toBe("A. García");
    expect(p.stats.pts).toBe(520);
    expect(p.stats.gp).toBe(42);
    expect(p.stats.salary).toBe(70000);
  });

  it("lista vacía → solo encabezado", () => {
    expect(playersToCsv([]).split("\n")).toHaveLength(1);
  });
});
