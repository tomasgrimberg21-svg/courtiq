"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { analyzePlayer } from "@/lib/moneyball";
import { SALARY_MAX } from "@/lib/sample-data";
import { getWatchSnapshot, removeWatch, subscribe } from "@/lib/storage/local";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UVScoreBadge } from "@/components/analytics/UVScoreBadge";

export function WatchlistView() {
  const entries = useSyncExternalStore(subscribe, getWatchSnapshot, getWatchSnapshot);

  const rows = useMemo(
    () =>
      entries.map((e) => {
        const uv = analyzePlayer(e.player.stats, {
          league: e.player.league,
          salaryMax: SALARY_MAX[e.player.league],
        }).layers.uvScore;
        return { entry: e, currentUv: uv, delta: uv - e.addedUv };
      }),
    [entries],
  );

  function drop(id: string) {
    removeWatch(id);
  }

  if (entries.length === 0) {
    return (
      <Card className="text-center text-sm text-ink-muted">
        No estás siguiendo a nadie todavía. Usá <span className="text-brand">+ Seguir</span> en un perfil o
        resultado para monitorear su UV Score.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        Te avisamos cuando el UV Score de un jugador seguido cambia respecto de cuando lo agregaste.
      </p>
      {rows.map(({ entry, currentUv, delta }) => (
        <Card key={entry.player.id} className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/player/${entry.player.id}`} className="font-heading text-lg text-ink hover:text-brand">
              {entry.player.name}
            </Link>
            <p className="text-sm text-ink-muted">
              {entry.player.team} · {entry.player.position} <Badge tone="neutral">{entry.player.league}</Badge>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UVScoreBadge uvScore={currentUv} />
            <span
              className="font-numeric text-xs"
              style={{ color: delta > 0.01 ? "#00ff87" : delta < -0.01 ? "#ff4444" : "#8a8aa3" }}
              title="Cambio de UV desde que lo agregaste"
            >
              {delta > 0.01 ? "▲" : delta < -0.01 ? "▼" : "="} {Math.abs(delta).toFixed(2)}
            </span>
            <button onClick={() => drop(entry.player.id)} className="text-xs text-uv-red hover:underline">
              Quitar
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
