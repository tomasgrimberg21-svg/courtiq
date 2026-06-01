"use client";

import { useSyncExternalStore } from "react";
import { getSalarySnapshot, subscribe } from "@/lib/storage/local";
import { UVScoreBadge } from "./UVScoreBadge";

/**
 * Muestra el UV Score (badge semáforo) cuando el análisis de sueldos está activo, o el MBPVI
 * cuando está suspendido (el UV no es medible sin salario). Reactivo al interruptor global.
 */
export function ValueBadge({ uvScore, mbpvi, size = "sm" }: { uvScore: number; mbpvi: number; size?: "sm" | "lg" }) {
  const salaryOn = useSyncExternalStore(subscribe, getSalarySnapshot, getSalarySnapshot);

  if (salaryOn) return <UVScoreBadge uvScore={uvScore} size={size} />;

  const big = size === "lg";
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
      <span className={`uppercase tracking-wide text-ink-muted ${big ? "text-sm" : "text-[10px]"}`}>MBPVI</span>
      <span className={`font-numeric text-brand ${big ? "text-3xl" : "text-base"}`}>{mbpvi.toFixed(3)}</span>
    </div>
  );
}
