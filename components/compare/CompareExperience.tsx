"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyzePlayer, normalizeStat, perGame } from "@/lib/moneyball";
import { SAMPLE_PLAYERS, SALARY_MAX, getSamplePlayer } from "@/lib/sample-data";
import type { Player } from "@/types/player";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShareButton } from "@/components/common/ShareButton";

const LEAGUES = ["LNB", "NBA", "EuroLeague", "ACB", "NBB", "Liga Uruguaya"];
const A_COLOR = "#00ff87";
const B_COLOR = "#3da5ff";

function PlayerSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-heading text-xs uppercase text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-line bg-panel px-3 text-ink focus:border-brand"
      >
        {SAMPLE_PLAYERS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.league})
          </option>
        ))}
      </select>
    </label>
  );
}

interface Row {
  label: string;
  a: number;
  b: number;
  fmt: (n: number) => string;
}

export function CompareExperience() {
  const [aId, setAId] = useState(SAMPLE_PLAYERS[0]!.id);
  const [bId, setBId] = useState(SAMPLE_PLAYERS[2]!.id);
  const [toLeague, setToLeague] = useState("LNB");
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estado compartible por URL (?a=&b=&to=). Post-mount a propósito: window solo existe en
  // cliente; hidratar desde la URL acá evita un mismatch en esta página prerenderizada.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ua = p.get("a");
    const ub = p.get("b");
    const uto = p.get("to");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (ua && getSamplePlayer(ua)) setAId(ua);
    if (ub && getSamplePlayer(ub)) setBId(ub);
    if (uto) setToLeague(uto);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const buildShareUrl = () =>
    `${window.location.origin}/compare?a=${encodeURIComponent(aId)}&b=${encodeURIComponent(bId)}&to=${encodeURIComponent(toLeague)}`;

  const a = getSamplePlayer(aId)!;
  const b = getSamplePlayer(bId)!;

  const aL = useMemo(() => analyzePlayer(a.stats, { league: a.league, salaryMax: SALARY_MAX[a.league] }).layers, [a]);
  const bL = useMemo(() => analyzePlayer(b.stats, { league: b.league, salaryMax: SALARY_MAX[b.league] }).layers, [b]);

  const normPg = (p: Player, value: number) => normalizeStat(perGame(value, p.stats.gp), p.league, toLeague);

  const barData = [
    { metric: "PTS", A: normPg(a, a.stats.pts), B: normPg(b, b.stats.pts) },
    { metric: "REB", A: normPg(a, a.stats.oreb + a.stats.dreb), B: normPg(b, b.stats.oreb + b.stats.dreb) },
    { metric: "AST", A: normPg(a, a.stats.ast), B: normPg(b, b.stats.ast) },
    { metric: "STL+BLK", A: normPg(a, a.stats.stl + a.stats.blk), B: normPg(b, b.stats.stl + b.stats.blk) },
  ].map((d) => ({ ...d, A: Number(d.A.toFixed(1)), B: Number(d.B.toFixed(1)) }));

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const f2 = (n: number) => n.toFixed(2);
  const f3 = (n: number) => n.toFixed(3);
  const rows: Row[] = [
    { label: "eFG%", a: aL.efg, b: bL.efg, fmt: pct },
    { label: "TS%", a: aL.ts, b: bL.ts, fmt: pct },
    { label: "FF_Score", a: aL.ffScore, b: bL.ffScore, fmt: f3 },
    { label: "BPM", a: aL.bpm, b: bL.bpm, fmt: f2 },
    { label: "TPI (40')", a: aL.tpi, b: bL.tpi, fmt: (n) => n.toFixed(0) },
    { label: "MBPVI", a: aL.mbpvi, b: bL.mbpvi, fmt: f3 },
    { label: "UV Score", a: aL.uvScore, b: bL.uvScore, fmt: f2 },
  ];

  async function explain() {
    setLoading(true);
    setNarrative(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: { stats: a.stats, league: a.league, name: a.name },
          b: { stats: b.stats, league: b.league, name: b.name },
          toLeague,
        }),
      });
      const data = await res.json();
      setNarrative(data.narrative ?? data.error ?? "Sin análisis disponible (¿falta ANTHROPIC_API_KEY?).");
    } catch {
      setNarrative("No se pudo conectar con el análisis IA.");
    } finally {
      setLoading(false);
    }
  }

  const winnerStyle = (mine: number, other: number, higherBetter = true) =>
    (higherBetter ? mine > other : mine < other) ? "text-brand font-numeric" : "font-numeric text-ink-muted";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlayerSelect label="Jugador A" value={aId} onChange={setAId} />
        <PlayerSelect label="Jugador B" value={bId} onChange={setBId} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-heading text-xs uppercase text-ink-muted">Normalizar a liga</span>
          <select
            value={toLeague}
            onChange={(e) => setToLeague(e.target.value)}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-ink focus:border-brand"
          >
            {LEAGUES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: A_COLOR }} /> {a.name} <Badge tone="neutral">{a.league}</Badge>
        </span>
        <span className="text-ink-muted">vs</span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ background: B_COLOR }} /> {b.name} <Badge tone="neutral">{b.league}</Badge>
        </span>
      </div>

      <div className="flex justify-center">
        <ShareButton getUrl={buildShareUrl} label="Compartir comparación" />
      </div>

      <Card>
        <h2 className="font-heading text-sm uppercase text-ink-muted">
          Volumen normalizado por partido (LQW → {toLeague})
        </h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid stroke="#24243a" strokeDasharray="3 3" />
              <XAxis dataKey="metric" tick={{ fill: "#8a8aa3", fontSize: 12 }} />
              <YAxis tick={{ fill: "#8a8aa3", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#111119", border: "1px solid #24243a", borderRadius: 8, color: "#e9e9f2" }}
                cursor={{ fill: "#ffffff08" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="A" name={a.name} fill={A_COLOR} radius={[3, 3, 0, 0]} />
              <Bar dataKey="B" name={b.name} fill={B_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="font-heading text-sm uppercase text-ink-muted">Métricas avanzadas (ganador en verde)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-muted">
                <th className="py-2 text-left font-medium">Métrica</th>
                <th className="py-2 text-right font-medium">{a.name}</th>
                <th className="py-2 text-right font-medium">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-2 text-ink-muted">{r.label}</td>
                  <td className={`py-2 text-right ${winnerStyle(r.a, r.b)}`}>{r.fmt(r.a)}</td>
                  <td className={`py-2 text-right ${winnerStyle(r.b, r.a)}`}>{r.fmt(r.b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm uppercase text-ink-muted">Análisis IA</h2>
          <Button variant="outline" size="sm" onClick={explain} disabled={loading}>
            {loading ? "Analizando…" : "Explicar con IA"}
          </Button>
        </div>
        {narrative && <p className="whitespace-pre-wrap text-sm text-ink">{narrative}</p>}
      </Card>
    </div>
  );
}
