/**
 * Parser de comandos de búsqueda en lenguaje simple (sin IA). Detecta en el texto:
 *  - edad máxima: "u21", "sub-21", "sub 21", "menores de 23"
 *  - arquetipo: "tiradores", "creadores", "reboteadores", "defensores", etc.
 *  - liga: "lnb", "nba", "euroliga", "acb", "nbb", etc.
 *  - posición: "base", "escolta", "alero", "ala-pívot", "pívot"
 * Lo que no matchea queda como texto libre (filtro por nombre/equipo).
 *
 * Función PURA y testeable.
 */
import type { Archetype } from "@/types/team";
import type { Position } from "@/types/player";

export interface ParsedCommand {
  ageMax?: number;
  archetype?: Archetype;
  league?: string;
  position?: Position;
  /** Texto restante (lo que no se interpretó como comando). */
  text: string;
}

const ARCHETYPE_WORDS: { re: RegExp; value: Archetype }[] = [
  { re: /\btirador(?:es)?\b/i, value: "Tirador" },
  { re: /\bcreador(?:es)?\b|\barmador(?:es)?\b|\bbase(?:s)?\s+creativ/i, value: "Creador" },
  { re: /\bslasher(?:s)?\b|\bpenetrador(?:es)?\b/i, value: "Slasher" },
  { re: /\bdefensor(?:es)?\s+perimetral(?:es)?\b|\bdefensor(?:es)?\b/i, value: "Defensor Perimetral" },
  { re: /\breboteador(?:es)?\b|\breboter(?:os)?\b/i, value: "Reboteador" },
  { re: /\bprotector(?:es)?\s+de\s+aro\b|\btaponador(?:es)?\b/i, value: "Protector de Aro" },
  { re: /\bstretch\s*big(?:s)?\b|\bpívot(?:es)?\s+tirador/i, value: "Stretch Big" },
  { re: /\bglue\s*guy(?:s)?\b/i, value: "Glue Guy" },
];

const LEAGUE_WORDS: { re: RegExp; value: string }[] = [
  { re: /\blnb\b/i, value: "LNB" },
  { re: /\bnba\b/i, value: "NBA" },
  { re: /\beuroliga\b|\beuroleague\b/i, value: "EuroLeague" },
  { re: /\bacb\b/i, value: "ACB" },
  { re: /\bnbb\b/i, value: "NBB" },
  { re: /\bliga\s+provincial\b|\bprovincial\b/i, value: "Liga Provincial ARG" },
  { re: /\bliga\s+uruguaya\b|\buruguay/i, value: "Liga Uruguaya" },
];

const POSITION_WORDS: { re: RegExp; value: Position }[] = [
  { re: /\bbases?\b|\bpoint\s*guards?\b/i, value: "Base" },
  { re: /\bescoltas?\b|\bshooting\s*guards?\b/i, value: "Escolta" },
  { re: /\bala-?pívots?\b|\bala-?pivots?\b|\bpower\s*forwards?\b/i, value: "Ala-Pívot" },
  { re: /\bpívots?\b|\bpivots?\b|\bcenters?\b/i, value: "Pívot" },
  { re: /\baleros?\b|\bsmall\s*forwards?\b/i, value: "Alero" },
];

export function parseSearchCommand(input: string): ParsedCommand {
  let text = ` ${input} `;
  const out: ParsedCommand = { text: input.trim() };

  // Edad: u21 / sub-21 / sub 21 / menores de 23 / hasta 25
  const ageRe = /\b(?:u|sub-?\s?)(\d{2})\b|\bmenores?\s+de\s+(\d{2})\b|\bhasta\s+(?:los\s+)?(\d{2})\b/i;
  const ageM = text.match(ageRe);
  if (ageM) {
    const raw = Number(ageM[1] ?? ageM[2] ?? ageM[3]);
    if (Number.isFinite(raw) && raw >= 14 && raw <= 45) {
      // "u21"/"sub-21" = menores de 21 (incluye 20) → edad máx = raw - 1; "menores de 23" = 22.
      out.ageMax = ageM[1] ? raw - 1 : raw;
      text = text.replace(ageM[0], " ");
    }
  }

  for (const { re, value } of ARCHETYPE_WORDS) {
    if (re.test(text)) { out.archetype = value; text = text.replace(re, " "); break; }
  }
  for (const { re, value } of LEAGUE_WORDS) {
    if (re.test(text)) { out.league = value; text = text.replace(re, " "); break; }
  }
  for (const { re, value } of POSITION_WORDS) {
    if (re.test(text)) { out.position = value; text = text.replace(re, " "); break; }
  }

  // Limpia palabras de relleno y deja el texto libre restante.
  const filler = /\b(arma|armame|armá|un|el|la|los|las|de|mejor(?:es)?|roster|quinteto|jugador(?:es)?|con|para|que|sean|sé)\b/gi;
  out.text = text.replace(filler, " ").replace(/\s+/g, " ").trim();
  return out;
}
