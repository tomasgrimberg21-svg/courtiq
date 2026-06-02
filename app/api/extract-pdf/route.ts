import { extractStatsFromText, extractPlayersTable } from "@/lib/pdf-extract";
import { isLnbFormat, parseLnbSheet } from "@/lib/pdf-lnb";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { json, errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 5_000_000; // 5M chars

/**
 * Recibe el TEXTO ya extraído del PDF (el cliente lo extrae con unpdf/pdfjs en el navegador,
 * que funciona de forma consistente; la extracción server-side fallaba en serverless).
 * Aplica los parsers (JS puro) y devuelve jugadores detectados.
 */
export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`extract-pdf:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let text: string;
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body.text !== "string") return errorJson("Falta el campo 'text'.", 400);
    text = body.text.slice(0, MAX_TEXT);
  } catch {
    return errorJson("JSON inválido.", 400);
  }

  if (!text || text.trim().length < 5) {
    return json({
      detection: { stats: {}, detectedCount: 0 },
      warning: "El PDF no contiene texto extraíble (probablemente es una imagen escaneada).",
    });
  }

  // Prioridad 1: planilla LNB / Liga Argentina.
  if (isLnbFormat(text)) {
    const lnb = parseLnbSheet(text);
    if (lnb.length > 0) {
      const table = lnb.map((r) => ({ name: r.name, stats: r.stats, position: r.position }));
      return json({ detection: { stats: {}, detectedCount: 0 }, table, format: "lnb" });
    }
  }

  // Prioridad 2: tabla genérica. Prioridad 3: ficha individual.
  const detection = extractStatsFromText(text);
  const table = extractPlayersTable(text);
  return json({ detection, table });
}
