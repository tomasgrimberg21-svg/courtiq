"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { MBPVIWeights } from "@/types/metrics";
import { DEFAULT_MBPVI_WEIGHTS, analyzePlayer } from "@/lib/moneyball";
import {
  getWeightsSnapshot,
  saveWeights,
  resetWeights,
  getSalarySnapshot,
  setSalaryEnabledPref,
  subscribe,
} from "@/lib/storage/local";
import { SAMPLE_PLAYERS, SALARY_MAX } from "@/lib/sample-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UVScoreBadge } from "@/components/analytics/UVScoreBadge";

const FIELDS: { key: keyof MBPVIWeights; label: string; hint: string; negative?: boolean }[] = [
  { key: "w1", label: "TPI (rendimiento per-40)", hint: "Producción total normalizada" },
  { key: "w2", label: "NRtg (impacto neto)", hint: "Diferencial por posesión" },
  { key: "w3", label: "Four Factors", hint: "Eficiencia compuesta (eFG, reb, TOV, FT)" },
  { key: "w4", label: "Cohesión de equipo", hint: "Entropía de minutos" },
  { key: "w5", label: "Penalización por salario", hint: "Cuánto castiga el costo", negative: true },
  { key: "w6", label: "Bonus por liga (LQW)", hint: "Premia venir de liga superior" },
];

export function WeightsPanel() {
  const router = useRouter();
  const stored = useSyncExternalStore(subscribe, getWeightsSnapshot, getWeightsSnapshot);
  const salaryOn = useSyncExternalStore(subscribe, getSalarySnapshot, getSalarySnapshot);
  const [draft, setDraft] = useState<MBPVIWeights>(stored);
  const [savedMsg, setSavedMsg] = useState(false);

  function set(key: keyof MBPVIWeights, value: number) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSavedMsg(false);
  }

  function onSave() {
    saveWeights(draft);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  function onReset() {
    setDraft({ ...DEFAULT_MBPVI_WEIGHTS });
    resetWeights();
  }

  // Preview en vivo: cómo quedan los UV (o MBPVI si sueldos off) de la muestra con el borrador.
  const preview = SAMPLE_PLAYERS.slice(0, 4).map((p) => {
    const l = analyzePlayer(p.stats, {
      league: p.league,
      salaryMax: SALARY_MAX[p.league],
      weights: draft,
      salaryEnabled: salaryOn,
    }).layers;
    return { name: p.name, uv: l.uvScore, mbpvi: l.mbpvi };
  });

  const sum = FIELDS.reduce((s, f) => s + (f.negative ? 0 : draft[f.key]), 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="flex flex-col gap-5">
        <div>
          <h2 className="font-heading text-sm uppercase text-ink-muted">Pesos del MBPVI</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Ajustá cuánto pesa cada componente en el índice de valor. Los cambios se aplican a toda la app.
          </p>
        </div>

        {/* Interruptor de análisis de sueldos */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-panel p-3">
          <div>
            <p className="text-sm text-ink">Análisis de sueldos</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {salaryOn
                ? "Activado: el MBPVI penaliza el costo y se calcula el UV Score (subvaloración)."
                : "Suspendido: se ignora el salario. La app rankea por MBPVI puro (sin UV Score)."}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={salaryOn}
            aria-label="Análisis de sueldos"
            onClick={() => setSalaryEnabledPref(!salaryOn)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${salaryOn ? "bg-brand" : "bg-panel-2"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${salaryOn ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {FIELDS.filter((f) => salaryOn || f.key !== "w5").map((f) => (
          <div key={f.key}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={f.key} className="text-sm text-ink">
                {f.label}
                <span className="ml-2 text-[11px] text-ink-muted">{f.hint}</span>
              </label>
              <span className="font-numeric text-sm text-brand">
                {f.negative ? "−" : ""}
                {draft[f.key].toFixed(2)}
              </span>
            </div>
            <input
              id={f.key}
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={draft[f.key]}
              onChange={(e) => set(f.key, Number(e.target.value))}
              className="mt-2 w-full accent-brand"
            />
          </div>
        ))}

        <p className="text-[11px] text-ink-muted">
          Suma de pesos positivos: <span className="font-numeric text-ink">{sum.toFixed(2)}</span>{" "}
          (no necesita ser exactamente 1; lo que importa es la proporción entre componentes).
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSave}>Guardar pesos</Button>
          <Button variant="outline" onClick={onReset}>
            Restablecer
          </Button>
          {savedMsg && <span className="text-sm text-brand">✓ Guardado — la app recalculó.</span>}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 self-start">
        <h3 className="font-heading text-sm uppercase text-ink-muted">Vista previa (muestra)</h3>
        <p className="text-[11px] text-ink-muted">
          {salaryOn ? "UV Score con estos pesos:" : "MBPVI con estos pesos (sueldos suspendidos):"}
        </p>
        <div className="flex flex-col gap-2">
          {preview.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-ink">{p.name}</span>
              {salaryOn ? (
                <UVScoreBadge uvScore={p.uv} />
              ) : (
                <span className="font-numeric text-sm text-brand">{p.mbpvi.toFixed(3)}</span>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/search")}
          className="mt-2 text-left text-xs text-brand hover:underline"
        >
          Ver ranking completo →
        </button>
      </Card>
    </div>
  );
}
