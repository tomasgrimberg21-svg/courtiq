"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { analyzePlayer } from "@/lib/moneyball";
import { SALARY_MAX, SAMPLE_PLAYERS } from "@/lib/sample-data";
import { leagueContext } from "@/lib/league-context";
import { radarProfile } from "@/lib/radar";
import { getPlayersSnapshot, getSalarySnapshot, subscribe, deletePlayer } from "@/lib/storage/local";
import type { Player } from "@/types/player";
import { RadarChart } from "@/components/analytics/RadarChart";
import { LayerSystem } from "@/components/analytics/LayerSystem";
import { LeagueContext } from "@/components/analytics/LeagueContext";
import { ScoutNotes } from "@/components/players/ScoutNotes";
import { MethodologyCard } from "@/components/analytics/MethodologyCard";
import { SeasonTrend } from "@/components/analytics/SeasonTrend";
import { ValueBadge } from "@/components/analytics/ValueBadge";
import { SourceBadge } from "@/components/analytics/SourceBadge";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ExportPdfButton } from "@/components/player/ExportPdfButton";
import { WatchButton } from "@/components/watchlist/WatchButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const UV_EXPLAIN: Record<string, string> = {
  "OBJETIVO PRIORITARIO": "Rinde muy por encima de su costo — candidato prioritario de fichaje.",
  "BUENA INVERSIÓN": "Buena relación rendimiento/precio.",
  "PRECIO JUSTO": "Su rendimiento está en línea con su costo de mercado.",
  SOBREVALORADO: "Su costo supera su aporte medible — fichaje de bajo valor.",
};

export function PlayerProfile({ id, samplePlayer }: { id: string; samplePlayer: Player | null }) {
  // Los jugadores manuales viven en localStorage; los de muestra llegan del server.
  const manualPlayers = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const salaryOn = useSyncExternalStore(subscribe, getSalarySnapshot, getSalarySnapshot);
  const player = samplePlayer ?? manualPlayers.find((p) => p.id === id) ?? null;

  if (!player) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="font-numeric text-4xl text-brand">∅</span>
        <h1 className="mt-2 font-heading text-2xl text-ink">Jugador no encontrado</h1>
        <p className="mt-2 text-sm text-ink-muted">
          No existe un jugador con ese identificador. Quizás lo borraste o el enlace es viejo.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/players/new">
            <Button>Cargar jugador</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">Ver jugadores</Button>
          </Link>
        </div>
      </main>
    );
  }

  const { layers, uvCategory } = analyzePlayer(player.stats, {
    league: player.league,
    salaryMax: SALARY_MAX[player.league],
  });
  const radar = radarProfile(player.stats, layers);
  const isManual = player.origin === "manual";
  const similar = SAMPLE_PLAYERS.filter((p) => p.position === player.position && p.id !== player.id).slice(0, 3);
  // Pool para el contexto de liga: cargados + muestra (sin duplicar al jugador actual).
  const pool = [...manualPlayers, ...SAMPLE_PLAYERS].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  if (!pool.some((p) => p.id === player.id)) pool.push(player);
  const context = leagueContext(player, pool);

  function onDelete() {
    if (window.confirm(`¿Borrar a ${player!.name}? Esta acción no se puede deshacer.`)) {
      deletePlayer(player!.id);
      window.location.href = "/search";
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-4xl text-ink">{player.name}</h1>
            <Badge tone="neutral">{player.league}</Badge>
          </div>
          <p className="mt-1 text-ink-muted">
            {player.team} · {player.position}
            {player.age ? ` · ${player.age} años` : ""} · {player.season}
          </p>
          <div className="mt-3">
            <SourceBadge player={player} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ValueBadge uvScore={layers.uvScore} mbpvi={layers.mbpvi} size="lg" />
          {salaryOn ? (
            <>
              <p className="max-w-xs text-right text-xs text-ink-muted">{UV_EXPLAIN[uvCategory.label] ?? ""}</p>
              <p className="max-w-xs text-right text-[10px] italic text-ink-muted/70">
                Señal de valor para revisar, no un veredicto de fichaje.
              </p>
            </>
          ) : (
            <p className="max-w-xs text-right text-[10px] italic text-ink-muted/70">
              Análisis de sueldos suspendido — se muestra MBPVI (rendimiento puro).
            </p>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <WatchButton player={player} uvScore={layers.uvScore} />
            <ExportPdfButton player={player} />
            {isManual && (
              <>
                <Link href={`/players/${player.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  Borrar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Radar + métricas clave */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="font-heading text-sm uppercase text-ink-muted">Perfil radar</h2>
          <RadarChart data={radar} />
        </Card>
        <div className="grid grid-cols-2 gap-3 self-start">
          <MetricCard label="MBPVI" value={layers.mbpvi.toFixed(3)} />
          {salaryOn ? (
            <MetricCard label="UV Score" value={layers.uvScore.toFixed(2)} />
          ) : (
            <MetricCard label="TPI (40')" value={layers.tpi.toFixed(0)} />
          )}
          <MetricCard label="eFG%" value={(layers.efg * 100).toFixed(1)} unit="%" />
          <MetricCard label="BPM" value={layers.bpm.toFixed(2)} />
        </div>
      </div>

      {/* Contexto de liga (percentiles vs el pool de esa liga) */}
      {context.length > 0 && (
        <section className="mt-6">
          <LeagueContext league={player.league} rows={context} />
        </section>
      )}

      {/* Histórico por temporada */}
      {player.history && player.history.length >= 2 && (
        <section className="mt-10">
          <Card>
            <h2 className="font-heading text-sm uppercase text-ink-muted">Evolución por temporada</h2>
            <div className="mt-4">
              <SeasonTrend history={player.history} />
            </div>
          </Card>
        </section>
      )}

      {/* Notas de scouting */}
      <section className="mt-6">
        <ScoutNotes playerId={player.id} />
      </section>

      {/* 8 capas */}
      <section className="mt-12">
        <h2 className="font-heading text-2xl text-ink">Las 8 Capas Moneyball</h2>
        <div className="mt-6">
          <LayerSystem stats={player.stats} layers={layers} />
        </div>
      </section>

      {/* Metodología / calibración */}
      <div className="mt-10">
        <MethodologyCard />
      </div>

      {/* Similares */}
      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-sm uppercase text-ink-muted">Jugadores similares ({player.position})</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {similar.map((p) => (
              <Link
                key={p.id}
                href={`/player/${p.id}`}
                className="rounded-lg border border-line bg-panel px-4 py-2 text-sm text-ink transition-colors hover:border-brand/50"
              >
                {p.name} <span className="text-ink-muted">· {p.league}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
