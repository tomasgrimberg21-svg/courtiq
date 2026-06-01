"use client";

import Link from "next/link";
import type { Player } from "@/types/player";
import type { LayerResults } from "@/types/metrics";
import { getUVCategory } from "@/lib/moneyball";
import { cn } from "@/lib/utils/cn";

export type SortKey = "uvScore" | "mbpvi" | "efg" | "ts" | "bpm" | "tpi" | "ffScore";

export interface RankedRow {
  player: Player;
  layers: LayerResults;
}

const COLUMNS: { key: SortKey; label: string; fmt: (l: LayerResults) => string }[] = [
  { key: "uvScore", label: "UV", fmt: (l) => l.uvScore.toFixed(2) },
  { key: "mbpvi", label: "MBPVI", fmt: (l) => l.mbpvi.toFixed(3) },
  { key: "efg", label: "eFG%", fmt: (l) => (l.efg * 100).toFixed(1) },
  { key: "ts", label: "TS%", fmt: (l) => (l.ts * 100).toFixed(1) },
  { key: "bpm", label: "BPM", fmt: (l) => l.bpm.toFixed(1) },
  { key: "tpi", label: "TPI", fmt: (l) => l.tpi.toFixed(0) },
  { key: "ffScore", label: "FF", fmt: (l) => l.ffScore.toFixed(3) },
];

export function RankingTable({
  rows,
  sortKey,
  desc,
  onSort,
}: {
  rows: RankedRow[];
  sortKey: SortKey;
  desc: boolean;
  onSort: (k: SortKey) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-panel/60 text-ink-muted">
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Jugador</th>
            <th className="px-3 py-2 text-left font-medium">Liga</th>
            {COLUMNS.map((c) => {
              const active = c.key === sortKey;
              return (
                <th
                  key={c.key}
                  className="px-3 py-2 text-right font-medium"
                  aria-sort={active ? (desc ? "descending" : "ascending") : "none"}
                >
                  <button
                    onClick={() => onSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1 hover:text-ink",
                      active && "text-brand",
                    )}
                  >
                    {c.label}
                    <span aria-hidden className="font-numeric text-[10px]">
                      {active ? (desc ? "▼" : "▲") : "↕"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, layers }, i) => {
            const cat = getUVCategory(layers.uvScore);
            return (
              <tr key={player.id} className="border-b border-line/60 last:border-0 hover:bg-panel/40">
                <td className="px-3 py-2 font-numeric text-ink-muted">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link href={`/player/${player.id}`} className="text-ink hover:text-brand">
                    {player.name}
                  </Link>
                  <span className="block text-[11px] text-ink-muted">
                    {player.team} · {player.position}
                  </span>
                </td>
                <td className="px-3 py-2 text-ink-muted">{player.league}</td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className="px-3 py-2 text-right font-numeric"
                    style={c.key === "uvScore" ? { color: `var(--color-uv-${cat.tone})` } : undefined}
                  >
                    {c.fmt(layers)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Devuelve el valor numérico de una fila para una clave de orden. */
export function sortValue(layers: LayerResults, key: SortKey): number {
  switch (key) {
    case "uvScore":
      return layers.uvScore;
    case "mbpvi":
      return layers.mbpvi;
    case "efg":
      return layers.efg;
    case "ts":
      return layers.ts;
    case "bpm":
      return layers.bpm;
    case "tpi":
      return layers.tpi;
    case "ffScore":
      return layers.ffScore;
  }
}
