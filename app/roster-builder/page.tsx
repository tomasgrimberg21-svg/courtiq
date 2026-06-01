import type { Metadata } from "next";
import { RosterBuilder } from "@/components/roster/RosterBuilder";

export const metadata: Metadata = {
  title: "Armador de Roster · CourtIQ",
  description: "Construí el quinteto óptimo con arquetipos, entropía de equipo y análisis por sector.",
};

export default function RosterBuilderPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Armador de Roster</h1>
      <p className="mt-2 text-ink-muted">
        Arrastrá jugadores del dataset de muestra a la cancha. Calculamos entropía, HHI y fortalezas por sector en vivo.
      </p>
      <div className="mt-8">
        <RosterBuilder />
      </div>
    </main>
  );
}
