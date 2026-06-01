import type { MetricContext } from "@/lib/league-context";
import { Card } from "@/components/ui/Card";

function pctColor(p: number): string {
  if (p >= 75) return "var(--color-uv-green)";
  if (p >= 50) return "var(--color-uv-gold)";
  if (p >= 25) return "var(--color-uv-white)";
  return "var(--color-uv-red)";
}

const PCT_FMT: Record<string, (v: number) => string> = {
  efg: (v) => `${(v * 100).toFixed(1)}%`,
  ts: (v) => `${(v * 100).toFixed(1)}%`,
};

function fmt(metric: string, v: number): string {
  if (PCT_FMT[metric]) return PCT_FMT[metric]!(v);
  if (metric === "tpi") return v.toFixed(0);
  if (metric === "mbpvi" || metric === "ffScore") return v.toFixed(3);
  return v.toFixed(2);
}

/** Compara cada métrica del jugador contra el promedio y percentil de su liga (dentro del pool). */
export function LeagueContext({ league, rows }: { league: string; rows: MetricContext[] }) {
  if (rows.length === 0) return null;
  const sample = rows[0]!.sampleSize;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-sm uppercase text-ink-muted">Contexto de liga ({league})</h2>
        <span className="text-[11px] text-ink-muted">vs {sample} jugadores del pool</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.metric}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-ink-muted">{r.label}</span>
              <span className="font-numeric text-ink">
                {fmt(r.metric, r.value)}
                <span className="ml-2 text-ink-muted">prom. {fmt(r.metric, r.avg)}</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.percentile}%`, backgroundColor: pctColor(r.percentile) }}
                />
              </div>
              <span className="w-16 text-right font-numeric text-[11px]" style={{ color: pctColor(r.percentile) }}>
                P{r.percentile}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-ink-muted/70">
        Percentil relativo a los jugadores de esta liga cargados. Con pocos jugadores es orientativo.
      </p>
    </Card>
  );
}
