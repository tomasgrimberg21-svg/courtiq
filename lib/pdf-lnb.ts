/**
 * Parser dedicado al formato de planilla de la LNB / Liga Argentina (estadísticas de jugadores).
 *
 * Estos PDFs vienen como UNA sola línea de texto (sin saltos), con columnas fijas:
 *   Jugador | PJ | Min Tot | Min PP | Pts Tot | Pts PP | TL A/I | TL PP | TL% |
 *   T2 A/I | T2 PP | T2% | T3 A/I | T3 PP | T3% | RD Tot | RD PP | RO Tot | RO PP |
 *   RT Tot | RT PP | Ast Tot | Ast PP | Tap C | Tap R | Rec Tot | Rec PP |
 *   Pér Tot | Pér PP | Fal C | Fal R | Val Tot | Val PP
 *
 * Nombres tipo "SABIN, T." (APELLIDO, Inicial). Decimales con coma. Conversión/Intento como "125/140".
 * Usamos los TOTALES (no per-game) → gp>1, que es lo correcto para el sistema Moneyball.
 *
 * Parser PURO y testeable. Devuelve filas listas para `savePlayer`.
 */
import type { PlayerStats } from "@/types/metrics";
import type { Position } from "@/types/player";
import { inferPosition } from "./infer-position";

export interface LnbRow {
  name: string;
  stats: PlayerStats;
  /** Posición INFERIDA del perfil estadístico (la planilla no la trae). El usuario debería revisarla. */
  position: Position;
}

/** Convierte "996,5" o "1.170,6" (formato es-AR) a número. */
function num(raw: string): number {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Patrón de una fila de jugador. Anclado en el nombre ("APELLIDO, X." con posibles espacios/guiones)
 * seguido de la secuencia de columnas. Capturamos solo lo que usamos:
 *   PJ, MinTot, (skip MinPP), PtsTot, (skip PtsPP), TL(c/i), ..., T2(c/i), ..., T3(c/i), ...,
 *   RD, (RDpp), RO, (ROpp), RT, (RTpp), Ast, (Astpp), TapC(blk), TapR, Rec(stl), (Recpp),
 *   Pér(tov), (Pérpp), FalC(pf), ...
 *
 * Para robustez, en vez de un mega-regex frágil, tokenizamos por jugador.
 */
const NAME_RE = /[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ.'\- ]+,\s*[A-ZÁÉÍÓÚÜÑ]\.?/g;

/** Detecta si el texto parece una planilla LNB (por sus encabezados característicos). */
export function isLnbFormat(text: string): boolean {
  const hasHeaders = /Jugador/i.test(text) && /TL\s*A\/I/i.test(text) && /T2\s*A\/I/i.test(text) && /T3\s*A\/I/i.test(text);
  const hasNamePattern = NAME_RE.test(text);
  NAME_RE.lastIndex = 0;
  return hasHeaders && hasNamePattern;
}

/** Tokeniza la "fila" de un jugador (texto entre su nombre y el próximo nombre). */
function parseRow(name: string, body: string): LnbRow | null {
  // Tokens: números (con , y .), pares "c/i", y porcentajes "89%".
  const tokens = body.trim().split(/\s+/).filter(Boolean);
  // Esperamos al menos: PJ MinTot MinPP PtsTot PtsPP TL_AI TL_PP TL% T2_AI T2_PP T2% T3_AI T3_PP T3% RD RDpp RO ROpp RT RTpp Ast Astpp TapC TapR Rec Recpp Per Perpp FalC ...
  if (tokens.length < 25) return null;

  let i = 0;
  const nextNum = () => num(tokens[i++] ?? "0");
  const skip = (k = 1) => { i += k; };
  /** Lee un par "conv/int". Si el token no tiene "/", devuelve [0,0] sin consumir de más. */
  const pair = (): [number, number] => {
    const t = tokens[i++] ?? "";
    const m = t.match(/^(\d+)\/(\d+)$/);
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
  };

  const gp = nextNum();          // PJ
  const min = nextNum();         // Min Tot
  skip();                        // Min PP
  const pts = nextNum();         // Pts Tot
  skip();                        // Pts PP
  const [ftm, fta] = pair();     // TL A/I
  skip();                        // TL PP (par "x/y" o "x/y"?) — en realidad TL PP es "3,6/4"
  skip();                        // TL%
  const [t2m, t2a] = pair();     // T2 A/I
  skip();                        // T2 PP
  skip();                        // T2%
  const [t3m, t3a] = pair();     // T3 A/I
  skip();                        // T3 PP
  skip();                        // T3%
  const dreb = nextNum();        // RD Tot
  skip();                        // RD PP
  const oreb = nextNum();        // RO Tot
  skip();                        // RO PP
  skip();                        // RT Tot
  skip();                        // RT PP
  const ast = nextNum();         // Ast Tot
  skip();                        // Ast PP
  const blk = nextNum();         // Tap C (tapones a favor)
  skip();                        // Tap R (recibidos)
  const stl = nextNum();         // Rec Tot (recuperos)
  skip();                        // Rec PP
  const tov = nextNum();         // Pér Tot
  skip();                        // Pér PP
  const pf = nextNum();          // Fal C

  if (gp <= 0) return null;

  // Limpia restos de encabezado pegados al primer nombre (ej. "PP SABIN, T." → "SABIN, T.").
  const cleanName = name.replace(/\s+/g, " ").trim().replace(/^(?:PP|Val|Tot)\s+/i, "");

  const stats: PlayerStats = {
    pts,
    fgm: t2m + t3m,
    fga: t2a + t3a,
    threePm: t3m,
    threePa: t3a,
    ftm,
    fta,
    ast,
    oreb,
    dreb,
    stl,
    blk,
    tov,
    pf,
    min,
    gp,
  };
  return { name: cleanName, stats, position: inferPosition(stats) };
}

/**
 * Parsea una planilla LNB completa. Encuentra cada nombre y parsea el bloque que le sigue
 * hasta el próximo nombre.
 */
export function parseLnbSheet(text: string): LnbRow[] {
  // Recortamos desde el primer nombre (saltamos los encabezados).
  const matches = [...text.matchAll(NAME_RE)];
  if (matches.length === 0) return [];

  const out: LnbRow[] = [];
  for (let k = 0; k < matches.length; k++) {
    const m = matches[k]!;
    const name = m[0]!;
    const start = m.index! + name.length;
    const end = k + 1 < matches.length ? matches[k + 1]!.index! : text.length;
    const body = text.slice(start, end);
    const row = parseRow(name, body);
    if (row) out.push(row);
  }
  return out;
}
