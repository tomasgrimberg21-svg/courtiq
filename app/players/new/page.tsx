import type { Metadata } from "next";
import { NewPlayerTabs } from "@/components/players/NewPlayerTabs";

export const metadata: Metadata = {
  title: "Cargar jugador · CourtIQ",
  description: "Cargá manualmente las estadísticas de un jugador para calcular sus métricas avanzadas.",
};

export default function NewPlayerPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Cargar jugador</h1>
      <p className="mt-2 text-ink-muted">
        Ingresá las estadísticas (de tu planilla o de la fuente que uses). CourtIQ calcula el resto.
      </p>
      <div className="mt-8">
        <NewPlayerTabs />
      </div>
    </main>
  );
}
