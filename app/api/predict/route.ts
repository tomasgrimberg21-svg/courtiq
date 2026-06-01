import type { PlayerStats } from "@/types/metrics";
import { calcTPI } from "@/lib/moneyball";
import { predictRequestSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { json, errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pendiente de regresión lineal simple de y sobre el índice 0..n-1. */
function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i]! - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** R² del ajuste lineal (0..1), para estimar confianza. */
function rSquared(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0.5;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const m = slope(values);
  const meanX = (n - 1) / 2;
  const b = meanY - m * meanX;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = m * i + b;
    ssRes += (values[i]! - pred) ** 2;
    ssTot += (values[i]! - meanY) ** 2;
  }
  if (ssTot === 0) return 1;
  return Math.max(0, Math.min(1, 1 - ssRes / ssTot));
}

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`predict:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson("JSON inválido", 400);
  }

  const parsed = predictRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(parsed.error.issues.map((i) => i.message).join("; "), 422);
  }

  const history = parsed.data.historicalStats;
  const last = history[history.length - 1]!;

  // Proyectamos métricas clave con regresión lineal sobre las temporadas provistas.
  const keys = ["pts", "ast", "oreb", "dreb", "stl", "blk", "tov"] as const;
  const nextSeasonPrediction: Partial<PlayerStats> = {};
  for (const k of keys) {
    const series = history.map((h) => h[k]);
    const projected = last[k] + slope(series);
    nextSeasonPrediction[k] = Math.max(0, Number(projected.toFixed(2)));
  }

  // Tendencia global basada en TPI por temporada.
  const tpiSeries = history.map((h) => calcTPI(h));
  const tpiSlope = slope(tpiSeries);
  const confidence = Number(rSquared(history.map((h) => h.pts)).toFixed(2));
  const trendDirection: "improving" | "declining" | "stable" =
    tpiSlope > 0.5 ? "improving" : tpiSlope < -0.5 ? "declining" : "stable";

  const labels = { improving: "en ascenso", declining: "en descenso", stable: "estable" };
  const narrative = `Sobre ${history.length} temporadas, el rendimiento (TPI) viene ${labels[trendDirection]} ` +
    `(pendiente ${tpiSlope.toFixed(1)}/temporada). Proyección de puntos: ${nextSeasonPrediction.pts}. ` +
    `Confianza del ajuste: ${(confidence * 100).toFixed(0)}%.`;

  return json({ nextSeasonPrediction, confidence, trendDirection, narrative });
}
