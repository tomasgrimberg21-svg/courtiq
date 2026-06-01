import { describe, expect, it } from "vitest";
import { parsePlayersCsv, splitLine, detectSeparator } from "./csv-import";

const HEADER = "nombre,equipo,liga,posicion,gp,min,pts,fgm,fga,3pm,3pa,ftm,fta,ast,oreb,dreb,stl,blk,tov,pf";
const ROW = "M. Test,Club X,LNB,Base,40,1200,520,180,400,70,200,80,100,200,40,120,55,8,110,90";

describe("splitLine", () => {
  it("separa por coma", () => {
    expect(splitLine("a,b,c", ",")).toEqual(["a", "b", "c"]);
  });
  it("respeta comillas con comas internas", () => {
    expect(splitLine('"Pérez, Juan",LNB', ",")).toEqual(["Pérez, Juan", "LNB"]);
  });
  it("maneja comillas escapadas", () => {
    expect(splitLine('"a""b",c', ",")).toEqual(['a"b', "c"]);
  });
  it("soporta tabs", () => {
    expect(splitLine("a\tb\tc", "\t")).toEqual(["a", "b", "c"]);
  });
});

describe("detectSeparator", () => {
  it("detecta tab", () => expect(detectSeparator("a\tb")).toBe("\t"));
  it("default coma", () => expect(detectSeparator("a,b")).toBe(","));
});

describe("parsePlayersCsv", () => {
  it("parsea una fila válida con todos los campos", () => {
    const res = parsePlayersCsv(`${HEADER}\n${ROW}`);
    expect(res.ok).toHaveLength(1);
    expect(res.failed).toHaveLength(0);
    const p = res.ok[0]!.player!;
    expect(p.name).toBe("M. Test");
    expect(p.team).toBe("Club X");
    expect(p.league).toBe("LNB");
    expect(p.position).toBe("Base");
    expect(p.stats.pts).toBe(520);
    expect(p.stats.gp).toBe(40);
    expect(p.origin).toBe("manual");
    expect(p.confidence).toBe(1);
  });

  it("acepta encabezados en inglés y alias", () => {
    const res = parsePlayersCsv("player,team,games,min,points,fgm,fga\nJohn Doe,Lakers,50,1500,1200,400,800");
    expect(res.ok).toHaveLength(1);
    expect(res.ok[0]!.player!.name).toBe("John Doe");
    expect(res.ok[0]!.player!.stats.pts).toBe(1200);
  });

  it("reparte rebote total (reb) si no hay oreb/dreb", () => {
    const res = parsePlayersCsv("nombre,gp,reb\nX,40,200");
    const s = res.ok[0]!.player!.stats;
    expect(s.oreb).toBeCloseTo(50, 1);
    expect(s.dreb).toBeCloseTo(150, 1);
  });

  it("acepta separador tab (TSV)", () => {
    const res = parsePlayersCsv("nombre\tgp\tpts\nY\t30\t300");
    expect(res.ok).toHaveLength(1);
    expect(res.ok[0]!.player!.stats.pts).toBe(300);
  });

  it("acepta decimales con coma (es-AR)", () => {
    const res = parsePlayersCsv("nombre,gp,min\nZ,40,1200,5");
    // min con coma decimal en celda citada
    const res2 = parsePlayersCsv('nombre,gp,pts\nZ,40,"12,5"');
    expect(res2.ok[0]!.player!.stats.pts).toBeCloseTo(12.5, 5);
    expect(res.ok).toHaveLength(1);
  });

  it("aplica defaults de liga/temporada", () => {
    const res = parsePlayersCsv("nombre,gp\nA,40", { league: "NBB", season: "2024/25" });
    expect(res.ok[0]!.player!.league).toBe("NBB");
    expect(res.ok[0]!.player!.season).toBe("2024/25");
  });

  it("rechaza fila con GP=0", () => {
    const res = parsePlayersCsv("nombre,gp\nA,0");
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0]!.error).toMatch(/GP/);
  });

  it("rechaza convertidos > intentados", () => {
    const res = parsePlayersCsv("nombre,gp,fgm,fga\nA,40,500,400");
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0]!.error).toMatch(/convertidos/);
  });

  it("rechaza valor no numérico", () => {
    const res = parsePlayersCsv("nombre,gp,pts\nA,40,abc");
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0]!.error).toMatch(/inválido/);
  });

  it("reporta error si falta columna nombre", () => {
    const res = parsePlayersCsv("equipo,gp\nClub,40");
    expect(res.ok).toHaveLength(0);
    expect(res.rows[0]!.error).toMatch(/nombre/);
  });

  it("mezcla filas válidas e inválidas, reportando ambas", () => {
    const res = parsePlayersCsv("nombre,gp,pts\nBueno,40,500\nMalo,0,300\nOtro,38,420");
    expect(res.ok).toHaveLength(2);
    expect(res.failed).toHaveLength(1);
    expect(res.failed[0]!.line).toBe(3); // 1=header, 2=Bueno, 3=Malo
  });

  it("CSV vacío → error claro", () => {
    expect(parsePlayersCsv("").rows[0]!.error).toMatch(/encabezados/);
  });
});
