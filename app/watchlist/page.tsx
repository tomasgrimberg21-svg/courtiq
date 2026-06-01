import type { Metadata } from "next";
import { WatchlistView } from "@/components/watchlist/WatchlistView";

export const metadata: Metadata = {
  title: "Seguimiento · CourtIQ",
  description: "Jugadores que seguís y alertas de cambio de UV Score.",
};

export default function WatchlistPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Seguimiento</h1>
      <p className="mt-2 text-ink-muted">Jugadores en seguimiento y alertas de UV Score.</p>
      <div className="mt-8">
        <WatchlistView />
      </div>
    </main>
  );
}
