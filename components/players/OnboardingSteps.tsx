import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    n: 1,
    title: "Cargá un jugador",
    body: "Ingresá sus estadísticas a mano, importá un CSV/TSV, o subí una ficha en PDF y autocompletamos.",
    href: "/players/new",
    cta: "Cargar jugador",
  },
  {
    n: 2,
    title: "Mirá su análisis",
    body: "CourtIQ calcula las 8 capas Moneyball, el UV Score (subvaloración) y el contexto vs su liga.",
    href: undefined,
    cta: undefined,
  },
  {
    n: 3,
    title: "Compará y armá tu roster",
    body: "Compará jugadores entre ligas, segui a tus objetivos y armá el quinteto óptimo.",
    href: "/roster-builder",
    cta: "Armar roster",
  },
];

/** Guía de 3 pasos para un usuario nuevo. Se muestra cuando todavía no cargó jugadores propios. */
export function OnboardingSteps() {
  return (
    <Card className="flex flex-col gap-4 border-brand/30">
      <div>
        <h2 className="font-heading text-lg text-ink">Primeros pasos</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Todavía no cargaste jugadores. Abajo ves un <span className="text-ink">dataset de muestra</span> para
          explorar; cuando cargues los tuyos aparecen acá.
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-4">
            <span className="font-numeric text-sm text-brand">{String(s.n).padStart(2, "0")}</span>
            <h3 className="font-heading text-sm text-ink">{s.title}</h3>
            <p className="text-xs text-ink-muted">{s.body}</p>
            {s.href && s.cta && (
              <Link href={s.href} className="mt-auto pt-1">
                <Button variant="outline" size="sm">
                  {s.cta}
                </Button>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
