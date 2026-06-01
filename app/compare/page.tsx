import type { Metadata } from "next";
import { CompareTabs } from "@/components/compare/CompareTabs";

export const metadata: Metadata = {
  title: "Comparador · CourtIQ",
  description: "Compará jugadores (con normalización LQW entre ligas) o quintetos completos.",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Comparador</h1>
      <p className="mt-2 text-ink-muted">
        Jugadores (normalizados con LQW entre ligas) o quintetos completos lado a lado.
      </p>
      <div className="mt-8">
        <CompareTabs />
      </div>
    </main>
  );
}
