import { describe, expect, it } from "vitest";
import { extractStatsFromText, extractPlayersTable } from "./pdf-extract";

describe("extractStatsFromText", () => {
  it("detecta nombre + stats con formato etiqueta: valor", () => {
    const text = `Ficha del jugador
Nombre: Facundo Méndez
Equipo: Instituto
Liga: LNB
Temporada 2025/26
Edad: 24
PTS: 18.5
REB: 6.2
AST: 5.1
GP: 40
MIN: 30.5`;
    const d = extractStatsFromText(text);
    expect(d.name).toBe("Facundo Méndez");
    expect(d.team).toBe("Instituto");
    expect(d.league).toBe("LNB");
    expect(d.season).toBe("2025/26");
    expect(d.age).toBe(24);
    expect(d.stats.pts).toBe(18.5);
    expect(d.stats.ast).toBe(5.1);
    expect(d.stats.gp).toBe(40);
    expect(d.detectedCount).toBeGreaterThanOrEqual(4);
  });

  it("soporta decimales con coma y separador con tab/espacios", () => {
    const text = "PTS  14,2\tAST  3,8\tGP  38";
    const d = extractStatsFromText(text);
    expect(d.stats.pts).toBeCloseTo(14.2, 5);
    expect(d.stats.ast).toBeCloseTo(3.8, 5);
    expect(d.stats.gp).toBe(38);
  });

  it("detecta FGM/FGA y triples sin confundirlos", () => {
    const text = "FGM: 6 FGA: 13 3PM: 2 3PA: 6 FTM: 4 FTA: 5";
    const d = extractStatsFromText(text);
    expect(d.stats.fgm).toBe(6);
    expect(d.stats.fga).toBe(13);
    expect(d.stats.threePm).toBe(2);
    expect(d.stats.threePa).toBe(6);
    expect(d.stats.ftm).toBe(4);
    expect(d.stats.fta).toBe(5);
  });

  it("texto sin datos → detección vacía, no lanza", () => {
    const d = extractStatsFromText("Documento sin estadísticas relevantes.");
    expect(d.detectedCount).toBe(0);
    expect(d.name).toBeUndefined();
    expect(Object.keys(d.stats)).toHaveLength(0);
  });

  it("ignora números negativos o no plausibles para edad", () => {
    const d = extractStatsFromText("Edad: 99 PTS: 10");
    expect(d.age).toBeUndefined(); // 99 fuera de rango
    expect(d.stats.pts).toBe(10);
  });

  it("alias en español (Puntos, Asistencias, Partidos)", () => {
    const d = extractStatsFromText("Puntos: 20 Asistencias: 7 Partidos: 35");
    expect(d.stats.pts).toBe(20);
    expect(d.stats.ast).toBe(7);
    expect(d.stats.gp).toBe(35);
  });

  it("recorta valores de texto al toparse con la próxima etiqueta (mismo renglón)", () => {
    const d = extractStatsFromText("Nombre: Lucas Fernández Equipo: Boca Liga: LNB");
    expect(d.name).toBe("Lucas Fernández");
    expect(d.team).toBe("Boca");
    expect(d.league).toBe("LNB");
  });
});

describe("extractPlayersTable (multi-jugador)", () => {
  const TABLE = `Plantel 2025/26
Jugador GP MIN PTS AST REB
M. Gómez 40 1200 18 5 4
L. Pérez 38 1100 14 3 7
J. Ruiz 35 900 9 6 2`;

  it("detecta varias filas de una tabla con encabezado", () => {
    const rows = extractPlayersTable(TABLE);
    expect(rows).toHaveLength(3);
    expect(rows[0]!.name).toBe("M. Gómez");
    expect(rows[0]!.stats.gp).toBe(40);
    expect(rows[0]!.stats.pts).toBe(18);
    expect(rows[0]!.stats.ast).toBe(5);
    expect(rows[2]!.name).toBe("J. Ruiz");
    expect(rows[2]!.stats.pts).toBe(9);
  });

  it("mapea columnas por orden del encabezado", () => {
    const rows = extractPlayersTable("Nombre PTS GP\nAna 25 40\nBeto 12 38");
    expect(rows[0]!.stats.pts).toBe(25);
    expect(rows[0]!.stats.gp).toBe(40);
    expect(rows[1]!.name).toBe("Beto");
  });

  it("sin encabezado mapeable → array vacío", () => {
    expect(extractPlayersTable("Texto narrativo sin tabla de stats.")).toEqual([]);
  });

  it("ignora filas que no parecen datos", () => {
    const rows = extractPlayersTable("Jugador GP PTS AST\nNota: este reporte es preliminar\nAna 40 18 5");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe("Ana");
  });
});
