import type { Metadata } from "next";
import { WeightsPanel } from "@/components/settings/WeightsPanel";

export const metadata: Metadata = {
  title: "Calibración · CourtIQ",
  description: "Ajustá los pesos del modelo MBPVI a tu liga y tu criterio.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Calibración del modelo</h1>
      <p className="mt-2 text-ink-muted">
        Los pesos por defecto son heurísticos. Ajustalos a tu liga y a tu criterio — todos los UV Score,
        MBPVI y rankings de la app se recalculan con tus valores.
      </p>
      <div className="mt-8">
        <WeightsPanel />
      </div>
    </main>
  );
}
