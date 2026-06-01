import { SearchBar } from "@/components/search/SearchBar";
import { StatCounter } from "@/components/landing/StatCounter";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

const FEATURES = [
  {
    title: "Carga manual",
    body: "Ingresá las estadísticas de cualquier liga (LNB, NBA, EuroLeague, ACB, NBB) y CourtIQ calcula el resto.",
  },
  {
    title: "UV Score",
    body: "Detecta jugadores subvalorados con un semáforo claro: del rojo sobrevalorado al verde objetivo.",
  },
  {
    title: "Armador de Roster",
    body: "Construí el quinteto óptimo con arquetipos, entropía de equipo y análisis por sector.",
  },
  {
    title: "Informe PDF",
    body: "Exportá el análisis con branding Meridian Sport para tu cuerpo técnico.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 py-20 sm:py-28">
      <Badge tone="brand" className="mb-8">
        <span className="font-numeric">●</span> Moneyball Analytics
      </Badge>

      <h1 className="font-heading max-w-4xl text-center text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
        Encontrá al próximo jugador{" "}
        <span className="text-brand">subvalorado</span> antes que nadie
      </h1>

      <p className="mt-6 max-w-xl text-center text-lg text-ink-muted">
        Análisis Moneyball para el básquet argentino e internacional. Métricas avanzadas,
        normalización entre ligas y detección de valor — en segundos.
      </p>

      <div className="mt-10 flex w-full flex-col items-center">
        <SearchBar />
      </div>

      {/* Stats en vivo */}
      <dl className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Jugadores analizados</dt>
          <dd className="text-base">
            <StatCounter value={3847} /> jugadores analizados
          </dd>
        </div>
        <span aria-hidden className="text-line">·</span>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Ligas cubiertas</dt>
          <dd className="text-base">
            <StatCounter value={12} /> ligas
          </dd>
        </div>
        <span aria-hidden className="text-line">·</span>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Métricas por jugador</dt>
          <dd className="text-base">
            <StatCounter value={8} /> capas de métricas
          </dd>
        </div>
      </dl>

      {/* Features */}
      <section
        aria-label="Funcionalidades"
        className="mt-24 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((f, i) => (
          <Card key={f.title} interactive>
            <span className="font-numeric text-sm text-brand">
              {String(i + 1).padStart(2, "0")}
            </span>
            <CardTitle className="mt-3">{f.title}</CardTitle>
            <CardDescription>{f.body}</CardDescription>
          </Card>
        ))}
      </section>
    </main>
  );
}
