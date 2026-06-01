"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { analyzePlayer, calcDrebPct } from "@/lib/moneyball";
import { classifyArchetype } from "@/lib/archetype";
import { SAMPLE_PLAYERS, SALARY_MAX } from "@/lib/sample-data";
import { getPlayersSnapshot, subscribe } from "@/lib/storage/local";
import type { LayerResults } from "@/types/metrics";
import type { Player } from "@/types/player";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterPanel, DEFAULT_FILTERS, type Filters } from "./FilterPanel";
import { PlayerResultCard } from "./PlayerResultCard";
import { RankingTable, sortValue, type SortKey } from "./RankingTable";
import { DataActions } from "@/components/players/DataActions";
import { OnboardingSteps } from "@/components/players/OnboardingSteps";

interface Analyzed {
  player: Player;
  layers: LayerResults;
}

type ViewMode = "cards" | "ranking";

export function SearchExperience({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [view, setView] = useState<ViewMode>("cards");
  const [sortKey, setSortKey] = useState<SortKey>("uvScore");
  const [desc, setDesc] = useState(true);

  function onSort(k: SortKey) {
    if (k === sortKey) setDesc((d) => !d);
    else {
      setSortKey(k);
      setDesc(true);
    }
  }

  // Jugadores cargados manualmente (reactivo) + dataset de muestra.
  const manualPlayers = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);

  const analyzed: Analyzed[] = useMemo(() => {
    const all = [...manualPlayers, ...SAMPLE_PLAYERS];
    return all.map((player) => ({
      player,
      layers: analyzePlayer(player.stats, {
        league: player.league,
        salaryMax: SALARY_MAX[player.league],
      }).layers,
    }));
  }, [manualPlayers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analyzed.filter(({ player, layers }) => {
      if (q && !player.name.toLowerCase().includes(q) && !player.team.toLowerCase().includes(q)) return false;
      if (filters.leagues.length && !filters.leagues.includes(player.league)) return false;
      if (filters.positions.length && !filters.positions.includes(player.position)) return false;
      if (filters.archetypes.length && !filters.archetypes.includes(classifyArchetype(player))) return false;
      if (player.age !== undefined && player.age > filters.ageMax) return false;
      if (layers.uvScore < filters.uvMin) return false;
      if (layers.efg * 100 < filters.efgMin) return false;
      if (calcDrebPct(player.stats) * 100 < filters.drebMin) return false;
      return true;
    });
  }, [analyzed, query, filters]);

  const sorted = useMemo(() => {
    const arr = [...results];
    arr.sort((a, b) => {
      const av = sortValue(a.layers, sortKey);
      const bv = sortValue(b.layers, sortKey);
      return desc ? bv - av : av - bv;
    });
    return arr;
  }, [results, sortKey, desc]);

  const manualCount = manualPlayers.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Filtrar por nombre o equipo
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por nombre o equipo…"
          className="h-11 flex-1 rounded-lg border border-line bg-panel px-4 text-ink placeholder:text-ink-muted/60 focus:border-brand"
        />
        <Link href="/players/new">
          <Button size="lg" className="w-full sm:w-auto">
            + Cargar jugador
          </Button>
        </Link>
      </div>

      {manualCount === 0 && (
        <div className="mb-8">
          <OnboardingSteps />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <FilterPanel filters={filters} onChange={setFilters} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-sm uppercase text-ink-muted">
              {results.length} resultado{results.length === 1 ? "" : "s"}
              <span className="ml-2 font-sans text-xs normal-case text-ink-muted">
                {manualCount > 0 ? `· ${manualCount} cargado${manualCount === 1 ? "" : "s"} + muestra` : "· dataset de muestra"}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Modo de vista" className="flex rounded-lg border border-line bg-panel p-0.5">
                <button
                  onClick={() => setView("cards")}
                  aria-pressed={view === "cards"}
                  className={`rounded-md px-2.5 py-1 text-xs ${view === "cards" ? "bg-panel-2 text-brand" : "text-ink-muted hover:text-ink"}`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setView("ranking")}
                  aria-pressed={view === "ranking"}
                  className={`rounded-md px-2.5 py-1 text-xs ${view === "ranking" ? "bg-panel-2 text-brand" : "text-ink-muted hover:text-ink"}`}
                >
                  Ranking
                </button>
              </div>
              <DataActions />
            </div>
          </div>

          {results.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-10 text-center text-sm text-ink-muted">
              <p>Sin resultados con estos filtros.</p>
              <Link href="/players/new">
                <Button variant="outline" size="sm">
                  Cargar un jugador
                </Button>
              </Link>
            </Card>
          ) : view === "ranking" ? (
            <RankingTable rows={sorted} sortKey={sortKey} desc={desc} onSort={onSort} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sorted.map(({ player, layers }) => (
                <PlayerResultCard key={player.id} player={player} layers={layers} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
