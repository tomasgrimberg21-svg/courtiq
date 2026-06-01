"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { perGame } from "@/lib/moneyball";
import type { PlayerStats } from "@/types/metrics";

const BRAND = "#00ff87";
const LINE = "#24243a";
const MUTED = "#8a8aa3";

const TREND_LABEL: Record<string, string> = {
  improving: "en ascenso",
  declining: "en descenso",
  stable: "estable",
};

export function SeasonTrend({ history }: { history: { season: string; stats: PlayerStats }[] }) {
  const [proj, setProj] = useState<{ ppg: number; trend: string; confidence: number } | null>(null);
  const lastGp = history[history.length - 1]?.stats.gp ?? 1;

  useEffect(() => {
    let active = true;
    fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historicalStats: history.map((h) => h.stats) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.nextSeasonPrediction) {
          setProj({ ppg: d.nextSeasonPrediction.pts / lastGp, trend: d.trendDirection, confidence: d.confidence });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [history, lastGp]);

  const data: { season: string; ppg: number }[] = history.map((h) => ({
    season: h.season,
    ppg: Number(perGame(h.stats.pts, h.stats.gp).toFixed(1)),
  }));
  if (proj) data.push({ season: "Proy.", ppg: Number(proj.ppg.toFixed(1)) });

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={LINE} strokeDasharray="3 3" />
            <XAxis dataKey="season" tick={{ fill: MUTED, fontSize: 12 }} />
            <YAxis tick={{ fill: MUTED, fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#111119", border: "1px solid #24243a", borderRadius: 8, color: "#e9e9f2" }}
              cursor={{ stroke: "#ffffff22" }}
            />
            <Line dataKey="ppg" name="PPG" stroke={BRAND} strokeWidth={2} dot={{ r: 3, fill: BRAND }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {proj && (
        <p className="mt-2 text-xs text-ink-muted">
          Tendencia <span className="text-brand">{TREND_LABEL[proj.trend] ?? proj.trend}</span> · proyección{" "}
          {proj.ppg.toFixed(1)} PPG la próxima temporada · confianza {(proj.confidence * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}
