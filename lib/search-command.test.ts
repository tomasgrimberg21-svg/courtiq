import { describe, expect, it } from "vitest";
import { parseSearchCommand } from "./search-command";

describe("parseSearchCommand", () => {
  it("'arma un roster u21 de los mejores tiradores' → ageMax 20 + Tirador", () => {
    const r = parseSearchCommand("arma un roster u21 de los mejores tiradores");
    expect(r.ageMax).toBe(20); // u21 = menores de 21
    expect(r.archetype).toBe("Tirador");
    expect(r.text).toBe(""); // todo interpretado / relleno
  });

  it("'pívots de la LNB' → posición Pívot + liga LNB", () => {
    const r = parseSearchCommand("pívots de la LNB");
    expect(r.position).toBe("Pívot");
    expect(r.league).toBe("LNB");
  });

  it("'sub-23 reboteadores' → ageMax 22 + Reboteador", () => {
    const r = parseSearchCommand("sub-23 reboteadores");
    expect(r.ageMax).toBe(22);
    expect(r.archetype).toBe("Reboteador");
  });

  it("'menores de 25' → ageMax 25", () => {
    expect(parseSearchCommand("menores de 25").ageMax).toBe(25);
  });

  it("texto sin comandos queda como búsqueda libre", () => {
    const r = parseSearchCommand("García");
    expect(r.ageMax).toBeUndefined();
    expect(r.archetype).toBeUndefined();
    expect(r.text).toBe("García");
  });

  it("'creadores nba' → Creador + NBA", () => {
    const r = parseSearchCommand("creadores nba");
    expect(r.archetype).toBe("Creador");
    expect(r.league).toBe("NBA");
  });

  it("no inventa edad con números no-edad", () => {
    // "5 tiradores" no debe leer 5 como edad (fuera de rango 14-45)
    const r = parseSearchCommand("5 tiradores");
    expect(r.ageMax).toBeUndefined();
    expect(r.archetype).toBe("Tirador");
  });
});
