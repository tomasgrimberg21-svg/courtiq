import { Card } from "@/components/ui/Card";

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}

/** Tarjeta de métrica individual: etiqueta + valor monoespaciado destacado. */
export function MetricCard({ label, value, unit, hint }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 font-numeric text-2xl text-brand">
        {value}
        {unit && <span className="ml-0.5 text-base text-ink-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </Card>
  );
}
