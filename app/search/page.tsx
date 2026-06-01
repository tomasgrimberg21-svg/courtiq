import type { Metadata } from "next";
import { SearchExperience } from "@/components/search/SearchExperience";

export const metadata: Metadata = {
  title: "Búsqueda · CourtIQ",
  description: "Buscá jugadores y equipos con análisis Moneyball y UV Score.",
};

// En Next 16 searchParams es una Promise.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <main>
      <SearchExperience initialQuery={q ?? ""} />
    </main>
  );
}
