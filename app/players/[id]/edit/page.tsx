import type { Metadata } from "next";
import { EditPlayerClient } from "@/components/players/EditPlayerClient";

export const metadata: Metadata = {
  title: "Editar jugador · CourtIQ",
};

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Editar jugador</h1>
      <p className="mt-2 text-ink-muted">Actualizá las estadísticas; las métricas se recalculan al guardar.</p>
      <div className="mt-8">
        <EditPlayerClient id={id} />
      </div>
    </main>
  );
}
