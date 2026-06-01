import { analyzePlayer, normalizeStat } from "@/lib/moneyball";
import { generateNarrative } from "@/lib/ai/analyze-agent";
import { compareRequestSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { json, errorJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MetricRow {
  key: string;
  label: string;
  a: number;
  b: number;
  /** "a" | "b" | "tie" — quién gana esa métrica. */
  winner: "a" | "b" | "tie";
}

function row(key: string, label: string, a: number, b: number, higherIsBetter = true): MetricRow {
  const eps = 1e-6;
  let winner: "a" | "b" | "tie" = "tie";
  if (Math.abs(a - b) > eps) {
    const aWins = higherIsBetter ? a > b : a < b;
    winner = aWins ? "a" : "b";
  }
  return { key, label, a: Number(a.toFixed(3)), b: Number(b.toFixed(3)), winner };
}

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(`compare:${clientIp(req)}`);
  if (!rl.ok) return errorJson("Demasiadas solicitudes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson("JSON inválido", 400);
  }

  const parsed = compareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(parsed.error.issues.map((i) => i.message).join("; "), 422);
  }

  const { a, b, toLeague = "LNB", narrative: wantNarrative } = parsed.data;
  const an = analyzePlayer(a.stats, { league: a.league });
  const bn = analyzePlayer(b.stats, { league: b.league });

  // Puntos normalizados entre ligas (LQW) para comparar volumen en una escala común.
  const aPtsNorm = normalizeStat(a.stats.pts, a.league, toLeague);
  const bPtsNorm = normalizeStat(b.stats.pts, b.league, toLeague);

  const comparison: MetricRow[] = [
    row("ptsNorm", `PTS (norm. ${toLeague})`, aPtsNorm, bPtsNorm),
    row("efg", "eFG%", an.layers.efg, bn.layers.efg),
    row("ts", "TS%", an.layers.ts, bn.layers.ts),
    row("ffScore", "FF_Score", an.layers.ffScore, bn.layers.ffScore),
    row("bpm", "BPM", an.layers.bpm, bn.layers.bpm),
    row("tpi", "TPI(40')", an.layers.tpi, bn.layers.tpi),
    row("mbpvi", "MBPVI", an.layers.mbpvi, bn.layers.mbpvi),
  ];

  let narrative: string | undefined;
  if (wantNarrative !== false) {
    try {
      narrative = await generateNarrative({
        name: `${a.name ?? "Jugador A"} vs ${b.name ?? "Jugador B"}`,
        league: `${a.league} / ${b.league} (normalizado a ${toLeague})`,
        layers: an.layers,
        uvCategory: an.uvCategory,
      });
    } catch {
      narrative = undefined;
    }
  }

  return json({
    toLeague,
    a: { name: a.name, league: a.league, layers: an.layers, uvCategory: an.uvCategory, ptsNorm: aPtsNorm },
    b: { name: b.name, league: b.league, layers: bn.layers, uvCategory: bn.uvCategory, ptsNorm: bPtsNorm },
    comparison,
    narrative,
  });
}
