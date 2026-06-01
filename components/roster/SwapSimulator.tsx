"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { computeRosterMetrics, type RosterMetrics } from "@/lib/roster";
import { getPlayersSnapshot, subscribe } from "@/lib/storage/local";
import { SAMPLE_PLAYERS } from "@/lib/sample-data";
import type { Player } from "@/types/player";
import { Card } from "@/components/ui/Card";

interface DiffRow {
  label: string;
  before: number;
  after: number;
  fmt: (n: number) => string;
  /** true = más alto es mejor (verde si sube). */
  higherBetter?: boolean;
}

function DeltaBadge({ before, after, fmt, higherBetter = true }: Omit<DiffRow, "label">) {
  const d = after - before;
  const eps = 1e-9;
  const improved = higherBetter ? d > eps : d < -eps;
  const worsened = higherBetter ? d < -eps : d > eps;
  const color = improved ? "var(--color-uv-green)" : worsened ? "var(--color-uv-red)" : "var(--color-ink-muted)";
  const arrow = Math.abs(d) < eps ? "=" : d > 0 ? "▲" : "▼";
  return (
    <span className="font-numeric text-xs" style={{ color }}>
      {arrow} {fmt(Math.abs(d))}
    </span>
  );
}

/**
 * Simulador "¿qué pasa si...?": reemplaza un jugador del quinteto por un candidato del pool
 * y muestra cómo cambian las métricas del equipo en vivo. No modifica el roster real.
 */
export function SwapSimulator({ roster }: { roster: Player[] }) {
  const manual = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const [outId, setOutId] = useState("");
  const [inId, setInId] = useState("");

  const candidates = useMemo(() => {
    const rosterIds = new Set(roster.map((p) => p.id));
    return [...manual, ...SAMPLE_PLAYERS].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i && !rosterIds.has(p.id),
    );
  }, [manual, roster]);

  const before = useMemo(() => computeRosterMetrics(roster), [roster]);

  const after = useMemo(() => {
    if (!outId || !inId) return null;
    const incoming = candidates.find((p) => p.id === inId);
    if (!incoming) return null;
    const next = roster.filter((p) => p.id !== outId).concat(incoming);
    return computeRosterMetrics(next);
  }, [outId, inId, roster, candidates]);

  if (roster.length < 2) return null;

  const rows = (b: RosterMetrics, a: RosterMetrics): DiffRow[] => [
    { label: "MBPVI prom.", before: b.mbpviAvg, after: a.mbpviAvg, fmt: (n) => n.toFixed(3) },
    { label: "Ataque", before: b.attack, after: a.attack, fmt: (n) => n.toFixed(0) },
    { label: "Defensa", before: b.defense, after: a.defense, fmt: (n) => n.toFixed(0) },
    { label: "Rebote", before: b.rebound, after: a.rebound, fmt: (n) => n.toFixed(0) },
    { label: "Cohesión", before: b.entropy, after: a.entropy, fmt: (n) => n.toFixed(2) },
  ];

  const outPlayer = roster.find((p) => p.id === outId);
  const inPlayer = candidates.find((p) => p.id === inId);
  const salaryBefore = roster.reduce((s, p) => s + (p.stats.salary ?? 0), 0);
  const salaryAfter =
    outPlayer && inPlayer ? salaryBefore - (outPlayer.stats.salary ?? 0) + (inPlayer.stats.salary ?? 0) : salaryBefore;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-sm uppercase text-ink-muted">Simulador de fichaje</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Probá reemplazar a un jugador del quinteto por un candidato y mirá el impacto. No cambia tu roster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-heading text-xs uppercase text-ink-muted">Sale</span>
          <select
            value={outId}
            onChange={(e) => setOutId(e.target.value)}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-ink focus:border-brand"
          >
            <option value="">— Elegí quién sale —</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.position})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-heading text-xs uppercase text-ink-muted">Entra</span>
          <select
            value={inId}
            onChange={(e) => setInId(e.target.value)}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-ink focus:border-brand"
          >
            <option value="">— Elegí el candidato —</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.league})
              </option>
            ))}
          </select>
        </label>
      </div>

      {before && after && outPlayer && inPlayer ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink">
            <span className="text-uv-red">↓ {outPlayer.name}</span> →{" "}
            <span className="text-brand">↑ {inPlayer.name}</span>
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-muted">
                <th className="py-1 text-left font-medium">Métrica</th>
                <th className="py-1 text-right font-medium">Antes</th>
                <th className="py-1 text-right font-medium">Después</th>
                <th className="py-1 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows(before, after).map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-1.5 text-ink-muted">{r.label}</td>
                  <td className="py-1.5 text-right font-numeric text-ink-muted">{r.fmt(r.before)}</td>
                  <td className="py-1.5 text-right font-numeric text-ink">{r.fmt(r.after)}</td>
                  <td className="py-1.5 text-right">
                    <DeltaBadge before={r.before} after={r.after} fmt={r.fmt} higherBetter={r.higherBetter} />
                  </td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="py-1.5 text-ink-muted">Salario total</td>
                <td className="py-1.5 text-right font-numeric text-ink-muted">${(salaryBefore / 1000).toFixed(0)}k</td>
                <td className="py-1.5 text-right font-numeric text-ink">${(salaryAfter / 1000).toFixed(0)}k</td>
                <td className="py-1.5 text-right">
                  <DeltaBadge before={salaryBefore} after={salaryAfter} fmt={(n) => `$${(n / 1000).toFixed(0)}k`} higherBetter={false} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-ink-muted/70">Elegí quién sale y quién entra para ver el impacto.</p>
      )}
    </Card>
  );
}
