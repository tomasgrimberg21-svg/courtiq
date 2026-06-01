"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { computeRosterMetrics, type RosterMetrics } from "@/lib/roster";
import { getRostersSnapshot, getPlayersSnapshot, subscribe, type SavedRoster } from "@/lib/storage/local";
import { getSamplePlayer } from "@/lib/sample-data";
import type { Player, Position } from "@/types/player";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricBar } from "@/components/analytics/MetricBar";

function resolvePlayers(slots: Partial<Record<Position, string>>, manual: Player[]): Player[] {
  const ids = Object.values(slots).filter(Boolean) as string[];
  return ids
    .map((id) => getSamplePlayer(id) ?? manual.find((p) => p.id === id) ?? null)
    .filter((p): p is Player => Boolean(p));
}

function MetricRow({ label, a, b, fmt, higherBetter = true }: { label: string; a: number; b: number; fmt: (n: number) => string; higherBetter?: boolean }) {
  const aWins = higherBetter ? a > b : a < b;
  const bWins = higherBetter ? b > a : b < a;
  const cls = (win: boolean) => (win ? "text-brand font-numeric" : "font-numeric text-ink-muted");
  return (
    <tr className="border-t border-line">
      <td className={`py-2 text-right ${cls(aWins)}`}>{fmt(a)}</td>
      <td className="py-2 text-center text-xs text-ink-muted">{label}</td>
      <td className={`py-2 text-left ${cls(bWins)}`}>{fmt(b)}</td>
    </tr>
  );
}

export function TeamCompare() {
  const rosters = useSyncExternalStore(subscribe, getRostersSnapshot, getRostersSnapshot);
  const manual = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  const rosterA = rosters.find((r) => r.id === aId) ?? null;
  const rosterB = rosters.find((r) => r.id === bId) ?? null;

  const mA = useMemo(() => (rosterA ? computeRosterMetrics(resolvePlayers(rosterA.slots, manual)) : null), [rosterA, manual]);
  const mB = useMemo(() => (rosterB ? computeRosterMetrics(resolvePlayers(rosterB.slots, manual)) : null), [rosterB, manual]);

  if (rosters.length < 2) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center text-sm text-ink-muted">
        <p>Necesitás al menos 2 quintetos guardados para compararlos.</p>
        <Link href="/roster-builder">
          <Button variant="outline" size="sm">Ir al armador de roster</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RosterSelect label="Quinteto A" value={aId} onChange={setAId} rosters={rosters} />
        <RosterSelect label="Quinteto B" value={bId} onChange={setBId} rosters={rosters} />
      </div>

      {mA && mB ? (
        <Card>
          <h2 className="font-heading text-sm uppercase text-ink-muted">
            {rosterA!.name} <span className="text-ink-muted/60">vs</span> {rosterB!.name}
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-ink-muted">
                <th className="py-1 text-right font-medium">{rosterA!.name}</th>
                <th className="py-1 text-center font-medium">Métrica</th>
                <th className="py-1 text-left font-medium">{rosterB!.name}</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow label="MBPVI prom." a={mA.mbpviAvg} b={mB.mbpviAvg} fmt={(n) => n.toFixed(3)} />
              <MetricRow label="FF_Score prom." a={mA.ffScoreAvg} b={mB.ffScoreAvg} fmt={(n) => n.toFixed(3)} />
              <MetricRow label="Ataque" a={mA.attack} b={mB.attack} fmt={(n) => n.toFixed(0)} />
              <MetricRow label="Defensa" a={mA.defense} b={mB.defense} fmt={(n) => n.toFixed(0)} />
              <MetricRow label="Rebote" a={mA.rebound} b={mB.rebound} fmt={(n) => n.toFixed(0)} />
              <MetricRow label="Cohesión (entropía)" a={mA.entropy} b={mB.entropy} fmt={(n) => n.toFixed(2)} />
            </tbody>
          </table>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TeamSectors title={rosterA!.name} m={mA} />
            <TeamSectors title={rosterB!.name} m={mB} />
          </div>
        </Card>
      ) : (
        <Card className="text-center text-sm text-ink-muted">Elegí dos quintetos para comparar.</Card>
      )}
    </div>
  );
}

function RosterSelect({ label, value, onChange, rosters }: { label: string; value: string; onChange: (v: string) => void; rosters: SavedRoster[] }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-heading text-xs uppercase text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-line bg-panel px-3 text-ink focus:border-brand"
      >
        <option value="">— Elegí un quinteto —</option>
        {rosters.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </label>
  );
}

function TeamSectors({ title, m }: { title: string; m: RosterMetrics }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-heading text-xs uppercase text-ink-muted">{title}</h3>
      <MetricBar label="Ataque" display={m.attack.toFixed(0)} pct={m.attack} />
      <MetricBar label="Defensa" display={m.defense.toFixed(0)} pct={m.defense} />
      <MetricBar label="Rebote" display={m.rebound.toFixed(0)} pct={m.rebound} />
    </div>
  );
}
