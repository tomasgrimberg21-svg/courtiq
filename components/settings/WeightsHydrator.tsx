"use client";

import { useSyncExternalStore } from "react";
import { getWeightsSnapshot, getSalarySnapshot, subscribe } from "@/lib/storage/local";
import { setActiveWeights, setSalaryEnabled } from "@/lib/moneyball";

/**
 * Aplica al integrador MBPVI las preferencias guardadas (pesos + interruptor de sueldos) en el
 * cliente, manteniéndolas sincronizadas. Sin UI. Render-time sync: seguro porque los setters
 * son idempotentes.
 */
export function WeightsHydrator() {
  const weights = useSyncExternalStore(subscribe, getWeightsSnapshot, getWeightsSnapshot);
  const salaryOn = useSyncExternalStore(subscribe, getSalarySnapshot, getSalarySnapshot);
  if (typeof window !== "undefined") {
    setActiveWeights(weights);
    setSalaryEnabled(salaryOn);
  }
  return null;
}
