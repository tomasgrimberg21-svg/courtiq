import { extractText, getDocumentProxy } from "unpdf";
import { extractStatsFromText, extractPlayersTable } from "@/lib/pdf-extract";
import { isLnbFormat, parseLnbSheet } from "@/lib/pdf-lnb";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { json, errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`extract-pdf:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let buffer: ArrayBuffer;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorJson("Adjuntá un archivo PDF en el campo 'file'.", 400);
    if (file.size > MAX_BYTES) return errorJson("El PDF supera los 10 MB.", 413);
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return errorJson("El archivo no parece ser un PDF.", 415);
    }
    buffer = await file.arrayBuffer();
  } catch {
    return errorJson("No se pudo leer el archivo.", 400);
  }

  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  } catch {
    return errorJson("No se pudo leer el texto del PDF (¿es un PDF escaneado/imagen?).", 422);
  }

  if (!text || text.trim().length < 5) {
    return json({
      detection: { stats: {}, detectedCount: 0 },
      warning: "El PDF no contiene texto extraíble (probablemente es una imagen escaneada).",
    });
  }

  // Prioridad 1: formato planilla LNB / Liga Argentina (columnas fijas, una sola línea).
  if (isLnbFormat(text)) {
    const lnb = parseLnbSheet(text);
    if (lnb.length > 0) {
      const table = lnb.map((r) => ({ name: r.name, stats: r.stats }));
      return json({ detection: { stats: {}, detectedCount: 0 }, table, format: "lnb" });
    }
  }

  // Prioridad 2: tabla genérica. Prioridad 3: ficha de un jugador.
  const detection = extractStatsFromText(text);
  const table = extractPlayersTable(text);
  return json({ detection, table });
}
