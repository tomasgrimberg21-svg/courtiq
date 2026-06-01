import { analyzePlayer } from "@/lib/moneyball";
import { generateNarrative } from "@/lib/ai/analyze-agent";
import { analyzeRequestSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { json, errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`analyze:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson("JSON inválido", 400);
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(parsed.error.issues.map((i) => i.message).join("; "), 422);
  }

  const { stats, league, salary, salaryMax, narrative: wantNarrative } = parsed.data;
  const merged = { ...stats, salary: salary ?? stats.salary };

  // Cálculo determinístico (siempre disponible, sin API key).
  const { layers, uvCategory } = analyzePlayer(merged, {
    league: league ?? stats.leagueOrigin,
    salaryMax: salaryMax ?? stats.salaryMax,
  });

  // Narrativa IA best-effort: si falla (sin key, rate limit upstream), seguimos sin ella.
  let narrative: string | undefined;
  if (wantNarrative !== false) {
    try {
      narrative = await generateNarrative({ league, layers, uvCategory });
    } catch {
      narrative = undefined;
    }
  }

  return json({
    mbpvi: layers.mbpvi,
    uvScore: layers.uvScore,
    uvCategory,
    layerResults: layers,
    narrative,
  });
}
