import type { LayerResults, PlayerStats } from "@/types/metrics";
import { perGame } from "@/lib/moneyball";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "./MetricCard";
import { MetricBar } from "./MetricBar";
import { UVScoreBadge } from "./UVScoreBadge";

function LayerHeader({ n, title }: { n: number | string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-numeric text-sm text-brand">CAPA {n}</span>
      <span className="h-px flex-1 bg-line" />
      <span className="font-heading text-sm uppercase text-ink-muted">{title}</span>
    </div>
  );
}

/** Visualización en cascada del sistema Moneyball (capas 0–8). Componente puro. */
export function LayerSystem({ stats, layers }: { stats: PlayerStats; layers: LayerResults }) {
  const g = (n: number) => perGame(n, stats.gp).toFixed(1);
  return (
    <div className="flex flex-col gap-8">
      {/* CAPA 0 — Raw */}
      <section className="flex flex-col gap-3">
        <LayerHeader n={0} title="Variables base (por partido)" />
        <Card className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ["PTS", g(stats.pts)],
            ["REB", g(stats.oreb + stats.dreb)],
            ["AST", g(stats.ast)],
            ["STL", g(stats.stl)],
            ["BLK", g(stats.blk)],
            ["TOV", g(stats.tov)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] uppercase text-ink-muted">{k}</div>
              <div className="font-numeric text-lg text-ink">{v}</div>
            </div>
          ))}
        </Card>
      </section>

      {/* CAPA 1 — Shooting */}
      <section className="flex flex-col gap-3">
        <LayerHeader n={1} title="Eficiencia de tiro" />
        <Card className="flex flex-col gap-4">
          <MetricBar label="TS% (True Shooting)" display={`${(layers.ts * 100).toFixed(1)}%`} pct={layers.ts * 100} />
          <MetricBar label="eFG% (Effective FG)" display={`${(layers.efg * 100).toFixed(1)}%`} pct={layers.efg * 100} />
          <MetricBar label="3PAr" display={layers.threePAr.toFixed(2)} pct={layers.threePAr * 100} />
          <MetricBar label="FTr" display={layers.ftr.toFixed(2)} pct={layers.ftr * 100} />
        </Card>
      </section>

      {/* CAPA 2 — Possessions */}
      <section className="flex flex-col gap-3">
        <LayerHeader n={2} title="Posesiones y ratings" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label="POSS" value={layers.poss.toFixed(1)} />
          <MetricCard label="ORtg" value={layers.ortg.toFixed(1)} />
          <MetricCard label="NRtg" value={layers.nrtg.toFixed(1)} hint="0 sin contexto rival" />
        </div>
      </section>

      {/* CAPA 3 — Four Factors */}
      <section className="flex flex-col gap-3">
        <LayerHeader n={3} title="Four Factors (pesos LNB)" />
        <Card>
          <MetricBar label="FF_Score" display={layers.ffScore.toFixed(3)} pct={layers.ffScore * 100} />
        </Card>
      </section>

      {/* CAPA 4 / 5 */}
      <section className="flex flex-col gap-3">
        <LayerHeader n="4·5" title="TPI · BPM · VORP" />
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="TPI (40')" value={layers.tpi.toFixed(1)} />
          <MetricCard label="BPM" value={layers.bpm.toFixed(2)} />
          <MetricCard label="VORP" value={layers.vorp.toFixed(2)} />
        </div>
      </section>

      {/* CAPA 8 — Integrador */}
      <section className="flex flex-col gap-3">
        <LayerHeader n={8} title="MBPVI + UV_Score (integrador)" />
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase text-ink-muted">MBPVI_ARG</div>
            <div className="font-numeric text-3xl text-brand">{layers.mbpvi.toFixed(3)}</div>
          </div>
          <UVScoreBadge uvScore={layers.uvScore} size="lg" />
        </Card>
      </section>
    </div>
  );
}
