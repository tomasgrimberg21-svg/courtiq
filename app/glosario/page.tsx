import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Glosario · CourtIQ",
  description: "Qué significan las métricas de CourtIQ, explicadas en simple.",
};

interface Term {
  sigla: string;
  nombre: string;
  simple: string;
  ejemplo?: string;
}

const SECCIONES: { titulo: string; terminos: Term[] }[] = [
  {
    titulo: "Eficiencia de tiro",
    terminos: [
      {
        sigla: "TS%",
        nombre: "True Shooting (tiro real)",
        simple:
          "Qué tan bien anota considerando TODO: dobles, triples y libres juntos. Premia al que convierte triples y va a la línea, no solo al que mete muchos tiros.",
        ejemplo: "60% es muy bueno; 50% es del montón.",
      },
      {
        sigla: "eFG%",
        nombre: "Efectividad de campo",
        simple:
          "Como el porcentaje de tiros de cancha, pero dándole más valor al triple (vale 1.5 veces un doble, porque suma más puntos).",
        ejemplo: "55% es buen tirador.",
      },
      {
        sigla: "3PAr",
        nombre: "Frecuencia de triples",
        simple: "De cada 10 tiros que toma, cuántos son de tres. Dice si el jugador es 'tirador' o juega más cerca del aro.",
      },
      {
        sigla: "FTr",
        nombre: "Frecuencia de libres",
        simple: "Cuántos tiros libres genera en relación a sus tiros. Alto = jugador agresivo que ataca el aro y cobra faltas.",
      },
    ],
  },
  {
    titulo: "Producción y posesiones",
    terminos: [
      {
        sigla: "POSS",
        nombre: "Posesiones",
        simple: "Cuántas veces el equipo tuvo la pelota mientras el jugador estaba en cancha. Sirve para comparar 'por oportunidad' y no por minutos.",
      },
      {
        sigla: "ORtg / DRtg",
        nombre: "Rating ofensivo / defensivo",
        simple: "Puntos que genera (o que recibe el rival) cada 100 posesiones. Más alto en ataque es bueno; más bajo en defensa es bueno.",
      },
      {
        sigla: "NRtg",
        nombre: "Rating neto",
        simple: "La diferencia entre lo que aporta atacando y lo que cede defendiendo. Es el impacto neto: ¿el equipo gana o pierde con él en cancha?",
      },
      {
        sigla: "TPI",
        nombre: "Índice de producción total",
        simple: "Un resumen de todo lo bueno (puntos, asistencias, rebotes, robos…) menos lo malo (pérdidas, tiros errados), ajustado a 40 minutos para comparar parejo.",
      },
    ],
  },
  {
    titulo: "Valor avanzado",
    terminos: [
      {
        sigla: "Four Factors",
        nombre: "Los cuatro factores",
        simple: "Un puntaje que junta las 4 cosas que más deciden los partidos: tirar bien, rebotear, no perder la pelota y cobrar libres.",
      },
      {
        sigla: "BPM",
        nombre: "Box Plus/Minus",
        simple: "Estima cuántos puntos por cada 100 posesiones aporta el jugador por encima de un jugador promedio. Positivo = suma; negativo = resta.",
      },
      {
        sigla: "MBPVI",
        nombre: "Índice de valor Moneyball",
        simple: "El número integrador de CourtIQ: combina rendimiento, impacto, eficiencia, encaje en el equipo y (si está activo) el costo. Es la nota global del jugador.",
      },
      {
        sigla: "UV Score",
        nombre: "Subvaloración",
        simple: "Cuánto rinde el jugador en relación a lo que cuesta. Alto = das mucho por poca plata (ganga). Si suspendés el análisis de sueldos, este número se oculta.",
        ejemplo: "🟢 +2.5 objetivo prioritario · 🟡 1.5-2.5 buena inversión · ⚪ 0.8-1.5 precio justo · 🔴 -0.8 caro.",
      },
    ],
  },
  {
    titulo: "Comparación entre ligas y equipos",
    terminos: [
      {
        sigla: "LQW",
        nombre: "Peso de calidad de liga",
        simple: "Un factor que ajusta los números según qué tan fuerte es la liga. 20 puntos en la NBA no es lo mismo que 20 en una liga menor: el LQW los pone en la misma escala.",
        ejemplo: "NBA 1.00 · EuroLeague 0.85 · LNB 0.50.",
      },
      {
        sigla: "Entropía",
        nombre: "Cohesión del equipo",
        simple: "Qué tan repartidos están los minutos entre los jugadores. Alta = plantel equilibrado; baja = dependés de pocas figuras.",
      },
      {
        sigla: "HHI",
        nombre: "Concentración de rotación",
        simple: "Lo opuesto a la cohesión: mide si la carga está muy concentrada en pocos jugadores (rotación corta) o bien distribuida.",
      },
      {
        sigla: "Arquetipo",
        nombre: "Tipo de jugador",
        simple: "La etiqueta de rol según cómo juega: Creador, Tirador, Reboteador, Protector de aro, etc. Sirve para armar un equipo equilibrado.",
      },
    ],
  },
];

export default function GlosarioPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading text-4xl text-ink">Glosario de métricas</h1>
      <p className="mt-2 text-ink-muted">
        Todas las métricas de CourtIQ explicadas en criollo, sin tecnicismos. No hace falta saber estadística
        para entender qué te dice cada número.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {SECCIONES.map((sec) => (
          <section key={sec.titulo}>
            <h2 className="font-heading text-sm uppercase text-brand">{sec.titulo}</h2>
            <div className="mt-4 flex flex-col gap-3">
              {sec.terminos.map((t) => (
                <Card key={t.sigla} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-numeric text-base text-brand">{t.sigla}</span>
                    <span className="font-heading text-sm text-ink">{t.nombre}</span>
                  </div>
                  <p className="text-sm text-ink-muted">{t.simple}</p>
                  {t.ejemplo && <p className="text-xs text-ink-muted/80">📊 {t.ejemplo}</p>}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-ink-muted/70">
        ¿Querés ver el detalle técnico de cómo se calcula cada una? Está en cada perfil de jugador, en la
        sección “Metodología y calibración”.
      </p>
    </main>
  );
}
