import { analyzePlayer } from "@/lib/moneyball";
import { SALARY_MAX } from "@/lib/sample-data";
import { renderPlayerReport, renderGenericReport, type PlayerReportData } from "@/lib/pdf/report-generator";
import { playerStatsSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function flatten(data: unknown): { label: string; value: string }[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data as Record<string, unknown>)
    .filter(([, v]) => ["string", "number", "boolean"].includes(typeof v))
    .map(([k, v]) => ({ label: k, value: String(v) }));
}

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`pdf:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let body: { type?: string; title?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return errorJson("JSON inválido", 400);
  }

  const type = body.type ?? "player";
  const title = (typeof body.title === "string" && body.title.trim().slice(0, 120)) || "Informe CourtIQ";
  const data = body.data ?? {};
  const generatedAt = new Date().toLocaleDateString("es-AR");

  try {
    let buffer: Buffer;

    if (type === "player") {
      // Acepta layers+uvCategory ya calculados, o stats crudos para calcular acá.
      let layers = data.layers as PlayerReportData["layers"] | undefined;
      let uvCategory = data.uvCategory as PlayerReportData["uvCategory"] | undefined;

      if (!layers || !uvCategory) {
        const parsed = playerStatsSchema.safeParse(data.stats);
        if (!parsed.success) {
          return errorJson("Para type='player' enviá data.layers+data.uvCategory o data.stats válidos.", 422);
        }
        const league = typeof data.league === "string" ? data.league : undefined;
        const analysis = analyzePlayer(parsed.data, { league, salaryMax: league ? SALARY_MAX[league] : undefined });
        layers = analysis.layers;
        uvCategory = analysis.uvCategory;
      }

      buffer = await renderPlayerReport(title, {
        name: String(data.name ?? "Jugador"),
        team: typeof data.team === "string" ? data.team : undefined,
        league: typeof data.league === "string" ? data.league : undefined,
        season: typeof data.season === "string" ? data.season : undefined,
        layers,
        uvCategory,
      }, generatedAt);
    } else {
      const rows = Array.isArray(data.rows)
        ? (data.rows as { label: string; value: string }[])
        : flatten(data);
      const subtitle = typeof data.subtitle === "string" ? data.subtitle : `Informe ${type}`;
      buffer = await renderGenericReport(title, subtitle, rows, generatedAt);
    }

    const safe = title.replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, "_").slice(0, 60) || "informe";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safe}.pdf"`,
      },
    });
  } catch (err) {
    return errorJson(err instanceof Error ? err.message : "Error generando PDF", 500);
  }
}
