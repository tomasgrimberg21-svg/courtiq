import type { Metadata } from "next";
import { BatchManager } from "@/components/players/BatchManager";

export const metadata: Metadata = {
  title: "Gestionar jugadores · CourtIQ",
  description: "Editá liga, temporada, equipo o posición de varios jugadores a la vez, o borralos en lote.",
};

export default function ManagePlayersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Gestionar jugadores</h1>
      <p className="mt-2 text-ink-muted">
        Seleccioná varios y editales liga, temporada, equipo o posición de una — útil tras importar una planilla.
      </p>
      <div className="mt-8">
        <BatchManager />
      </div>
    </main>
  );
}
