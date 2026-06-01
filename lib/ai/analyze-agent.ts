import type { LayerResults, UVCategory } from "@/types/metrics";
import { anthropic, model } from "./client";

const NARRATIVE_SYSTEM = `Sos un analista de scouting de básquet estilo Moneyball.
Recibís métricas avanzadas ya calculadas (MBPVI, UV_Score, eFG%, TS%, BPM, FF_Score, TPI).
Escribí un análisis ejecutivo en español rioplatense, conciso (máx 5 oraciones), para un director
deportivo. Explicá si el jugador está sub/sobrevalorado y por qué, en lenguaje claro y accionable.
No inventes datos que no estén en las métricas provistas.`;

export interface NarrativeInput {
  name?: string;
  league?: string;
  layers: LayerResults;
  uvCategory: UVCategory;
}

/**
 * Genera la narrativa del jugador (no-streaming). Sistema cacheado.
 * Pensado para correr tras `analyzePlayer`. Best-effort: el caller debe envolver en try/catch.
 */
export async function generateNarrative(input: NarrativeInput): Promise<string> {
  const { name = "El jugador", league = "su liga", layers, uvCategory } = input;
  const facts = [
    `Jugador: ${name} (${league}).`,
    `MBPVI: ${layers.mbpvi.toFixed(3)} · UV_Score: ${layers.uvScore.toFixed(2)} → ${uvCategory.label}.`,
    `eFG%: ${(layers.efg * 100).toFixed(1)} · TS%: ${(layers.ts * 100).toFixed(1)} · FF_Score: ${layers.ffScore.toFixed(3)}.`,
    `BPM: ${layers.bpm.toFixed(2)} · TPI(40'): ${layers.tpi.toFixed(1)} · NRtg: ${layers.nrtg.toFixed(1)}.`,
  ].join("\n");

  const msg = await anthropic().messages.create(
    {
      model: model(),
      max_tokens: 600,
      system: [
        { type: "text", text: NARRATIVE_SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: `Métricas:\n${facts}\n\nEscribí el análisis.` }],
    },
    // Timeout acotado + 1 reintento: la narrativa es best-effort, no debe colgar el endpoint.
    { timeout: 20_000, maxRetries: 1 },
  );

  return msg.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
