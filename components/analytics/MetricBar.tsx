"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface MetricBarProps {
  label: string;
  /** Valor a mostrar (texto, p.ej. "55.0%"). */
  display: string;
  /** Porcentaje de llenado 0–100. */
  pct: number;
}

/** Barra de métrica animada al montar. Respeta prefers-reduced-motion. */
export function MetricBar({ label, display, pct }: MetricBarProps) {
  const reduce = useReducedMotion();
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className="font-numeric text-sm text-ink">{display}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel-2">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
