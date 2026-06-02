import { describe, expect, it } from "vitest";
import { isLnbFormat, parseLnbSheet } from "./pdf-lnb";

// Línea con el formato REAL de la planilla LNB (una sola línea, decimales con coma, c/i con barra).
const HEADER =
  "LA LIGA NACIONAL DE BÁSQUETBOL Estadísticas de Jugadores - Serie Regular 2024/2025 " +
  "Jugador PJ Min Tot Min PP Pts Tot Pts PP TL A/I TL PP TL% T2 A/I T2 PP T2% T3 A/I T3 PP T3% " +
  "RD Tot RD PP RO Tot RO PP RT Tot RT PP Ast Tot Ast PP Tap C Tap R Rec Tot Rec PP Pér Tot Pér PP Fal C Fal R Val Tot Val PP ";

// SABIN, T. (verificado contra el PDF real).
const SABIN =
  "SABIN, T. 35 996,5 28,5 646 18,5 125/140 3,6/4 89% 106/192 3,0/5,5 55% 103/240 2,9/6,9 42% " +
  "97 2,8 13 0,4 110 3,1 60 1,7 1 6 26 0,7 69 2,0 67 124 3,5 587 ";

const WOODS =
  "WOODS, D. 36 972,5 27,0 573 15,9 120/164 3,3/4,6 73% 207/334 5,8/9,3 61% 13/37 0,4/1,0 35% " +
  "164 4,6 85 2,4 249 6,9 38 1,1 15 9 12 0,3 76 2,1 93 164 4,6 678 ";

describe("isLnbFormat", () => {
  it("reconoce la planilla LNB por sus encabezados", () => {
    expect(isLnbFormat(HEADER + SABIN)).toBe(true);
  });
  it("rechaza texto que no es planilla LNB", () => {
    expect(isLnbFormat("Nombre: Juan Pérez PTS: 18 AST: 5")).toBe(false);
  });
});

describe("parseLnbSheet", () => {
  it("parsea SABIN con stats correctas (totales)", () => {
    const rows = parseLnbSheet(HEADER + SABIN);
    const sabin = rows.find((r) => r.name.startsWith("SABIN"))!;
    expect(sabin).toBeTruthy();
    expect(sabin.name).toBe("SABIN, T.");
    expect(sabin.stats.gp).toBe(35);
    expect(sabin.stats.min).toBeCloseTo(996.5, 1);
    expect(sabin.stats.pts).toBe(646);
    expect(sabin.stats.ftm).toBe(125);
    expect(sabin.stats.fta).toBe(140);
    expect(sabin.stats.fgm).toBe(106 + 103); // T2c + T3c
    expect(sabin.stats.fga).toBe(192 + 240); // T2i + T3i
    expect(sabin.stats.threePm).toBe(103);
    expect(sabin.stats.threePa).toBe(240);
    expect(sabin.stats.dreb).toBe(97);
    expect(sabin.stats.oreb).toBe(13);
    expect(sabin.stats.ast).toBe(60);
    expect(sabin.stats.blk).toBe(1);
    expect(sabin.stats.stl).toBe(26);
    expect(sabin.stats.tov).toBe(69);
    expect(sabin.stats.pf).toBe(67);
  });

  it("limpia restos de encabezado del primer nombre (PP SABIN → SABIN)", () => {
    const rows = parseLnbSheet(HEADER + SABIN);
    // El primer nombre no debe arrastrar "PP" del encabezado.
    expect(rows[0]!.name).not.toMatch(/^PP /);
  });

  it("parsea múltiples jugadores", () => {
    const rows = parseLnbSheet(HEADER + SABIN + WOODS);
    expect(rows.length).toBe(2);
    const woods = rows.find((r) => r.name.startsWith("WOODS"))!;
    expect(woods.stats.gp).toBe(36);
    expect(woods.stats.pts).toBe(573);
    expect(woods.stats.threePm).toBe(13);
  });

  it("texto vacío o sin nombres → []", () => {
    expect(parseLnbSheet("sin datos")).toEqual([]);
  });
});
