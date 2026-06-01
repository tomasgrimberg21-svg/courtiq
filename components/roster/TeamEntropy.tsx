import { MetricBar } from "@/components/analytics/MetricBar";
import { Card } from "@/components/ui/Card";
import type { RosterMetrics } from "@/lib/roster";

export function TeamEntropy({ metrics }: { metrics: RosterMetrics }) {
  const entropyLabel =
    metrics.entropy >= 0.85 ? "Reparto muy equilibrado" : metrics.entropy >= 0.6 ? "Reparto equilibrado" : "Dependiente de pocos";
  const hhiLabel = metrics.hhi >= 0.5 ? "Rotación corta / concentrada" : "Rotación distribuida";

  return (
    <Card className="flex flex-col gap-4">
      <h3 className="font-heading text-sm uppercase text-ink-muted">Entropía del equipo</h3>
      <MetricBar label={`H_norm · ${entropyLabel}`} display={metrics.entropy.toFixed(2)} pct={metrics.entropy * 100} />
      <MetricBar label={`HHI minutos · ${hhiLabel}`} display={metrics.hhi.toFixed(2)} pct={metrics.hhi * 100} />
    </Card>
  );
}
