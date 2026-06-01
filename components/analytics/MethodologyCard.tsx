import { CALIBRATION_NOTES } from "@/lib/moneyball/calibration";
import { Card } from "@/components/ui/Card";

const STATUS_STYLE = {
  exacto: { color: "#00ff87", label: "EXACTO" },
  heurístico: { color: "#ffd700", label: "HEURÍSTICO" },
} as const;

/** Disclosure de metodología: qué métricas son aritmética estándar vs heurística ajustable. */
export function MethodologyCard() {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm uppercase text-ink-muted">Metodología y calibración</h2>
      <p className="text-xs text-ink-muted">
        Transparencia sobre cada número: lo marcado <span className="text-brand">EXACTO</span> es fórmula
        estándar validada; lo <span className="text-uv-gold">HEURÍSTICO</span> es estimación ajustable.
      </p>
      <ul className="flex flex-col divide-y divide-line">
        {CALIBRATION_NOTES.map((n) => {
          const s = STATUS_STYLE[n.status];
          return (
            <li key={n.metric} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex shrink-0 items-center gap-2 sm:w-64">
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium tracking-wide"
                  style={{ color: s.color, border: `1px solid ${s.color}66` }}
                >
                  {s.label}
                </span>
                <span className="font-numeric text-xs text-ink">{n.metric}</span>
              </div>
              <span className="text-xs text-ink-muted">{n.note}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
