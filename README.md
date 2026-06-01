# 🏀 CourtIQ — Moneyball Analytics

Plataforma de análisis estadístico estilo *Moneyball* para básquet argentino e internacional.
Calcula métricas avanzadas (MBPVI, UV_Score, TPI, BPM, Four Factors, LQW), detecta jugadores
subvalorados, arma rosters óptimos y exporta informes PDF.

> **Estética:** "data room de NBA meets sala de guerra táctica" — carbón `#0a0a0a`, esmeralda
> `#00ff87`, pizarra `#1a1a2e`. Tipografías: Oswald (display) · Space Mono (números) · DM Sans (cuerpo).

## Stack

- **Next.js 16** (App Router, RSC, Route Handlers) · **React 19** · **TypeScript** estricto
- **Tailwind CSS v4** (CSS-first, tokens en `@theme` dentro de `app/globals.css`)
- **Anthropic SDK** (`claude-sonnet-4-6` por defecto) con **web search GA** + streaming SSE
- **recharts** (radar/bar charts) · **@dnd-kit** (armador de roster) · **@react-pdf/renderer** (PDF)
- **Supabase** (caché de jugadores + rosters) · **Zod** (validación) · **Vitest** (tests)

## Inicio rápido

```bash
npm install
cp .env.local.example .env.local   # completá ANTHROPIC_API_KEY (opcional para features deterministas)
npm run dev                          # http://localhost:3000
```

> Las métricas, el comparador, el armador de roster y el cálculo de UV_Score funcionan **sin API key**
> (son determinísticos). La key habilita la búsqueda IA en tiempo real y las narrativas.

### Scripts

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Suite Vitest (42 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Variables de entorno

Ver `.env.local.example`. `ANTHROPIC_API_KEY` es **solo server-side** (validada lazy con Zod en
`lib/env.ts`). `ANTHROPIC_MODEL` permite cambiar a `claude-opus-4-8` para máxima calidad.

## Arquitectura

```
app/
  page.tsx              Landing (hero + búsqueda)
  search/               Resultados + filtros + IA en vivo (SSE)
  player/[id]/          Perfil: radar + 8 capas + export PDF
  compare/              Comparador entre ligas (LQW)
  roster-builder/       Armador drag&drop + entropía/HHI
  watchlist/            Seguimiento de jugadores + alertas de UV Score
  api/                  search (SSE) · ingest (extracción estructurada) · analyze · predict · compare · export-pdf
lib/
  moneyball/            Sistema de métricas en cascada (capas 0-8) + LQW
  ai/                   Agentes Claude (search-agent, analyze-agent) + SSE
  archetype.ts          Clasificación de arquetipos
  roster.ts             Agregación de métricas de equipo
  pdf/                  Generador de informes (@react-pdf)
  supabase/             Cliente + schema.sql
components/             ui · analytics · search · roster · compare · layout
types/                  player · team · metrics · league
```

## Sistema de métricas (8 capas)

`lib/moneyball/` implementa el algoritmo en cascada, con **guards de división por cero** centralizados
en `safeDiv` (capa 0):

| Capa | Contenido |
|---|---|
| 0 | Variables base + utilidades (`safeDiv`, `clamp`, `avgMinutes`) |
| 1 | Tiro: TS%, eFG%, 3PAr, FTr |
| 2 | Posesiones: POSS, ORtg, DRtg, NRtg |
| 3 | Four Factors (FF_Score con pesos calibrados para LNB/sudamérica) |
| 4 | TPI normalizado por 40' |
| 5 | BPM + VORP |
| 6 | Team Entropy Index (H_norm, Shannon) |
| 7 | HHI Coaching Index |
| 8 | **MBPVI_ARG** + **UV_Score** (integrador) + semáforo de subvaloración |

`lqw.ts` aporta los **League Quality Weights** (NBA 1.00 → Liga Provincial 0.25) y `normalizeStat`
para comparar entre ligas. El integrador `analyzePlayer(stats, opts)` corre todas las capas.

**UV_Score (semáforo):** 🟢 > 2.5 objetivo prioritario · 🟡 1.5-2.5 buena inversión ·
⚪ 0.8-1.5 precio justo · 🔴 < 0.8 sobrevalorado.

## Datos

`lib/sample-data.ts` provee 6 jugadores **ficticios de muestra** (marcados como tal en la UI) para que
todas las páginas rindan métricas reales sin backend. Los datos reales se obtienen vía búsqueda IA
(web search) y caché Supabase (`lib/supabase/schema.sql`).

## Tests

42 tests en `lib/moneyball/*.test.ts` y `lib/roster.test.ts` — cubren cada función de cálculo,
incluyendo **guards de división por cero** y valores esperados calculados a mano.

## Desviaciones documentadas respecto del prompt original

1. **Next.js 16, no 14** — el prompt pedía 14 pero el bootstrap usaba `create-next-app@latest`. 16
   soporta todo lo exigido. `params`/`searchParams` son `Promise` (se hace `await`).
2. **Sin `tailwind.config.ts`** — Tailwind v4 es CSS-first; los tokens viven en `@theme`.
3. **web search GA** — el SDK actual expone `web_search_20260209` en `client.messages.stream` (no se
   necesita `client.beta.*` ni el header `betas:['web-search-2025-03-05']`).
4. **Rate limit in-memory** (`lib/rate-limit.ts`) por-instancia; en producción horizontal usar Redis.

## Features de producto

- **Ingesta de datos reales**: `/api/ingest` extrae stats vía web search con **structured output** validado por Zod
  (`null` antes que inventar) + confianza por jugador + read-through cache. Trust UI: fuente, fecha y badge de confianza.
- **Rosters guardados + compartir**: guardá quintetos (localStorage + write-through a Supabase) y compartilos por URL.
- **Seguimiento + alertas UV**: seguí jugadores y mirá cómo cambia su UV Score (`/watchlist`).
- **Histórico por temporada**: evolución de PPG + proyección de tendencia.
- **Dark/Light**: el oscuro es el principal; toggle con persistencia y anti-FOUC.
- **Metodología transparente**: cada métrica marcada EXACTO (validada contra Curry 2015-16 de Basketball-Reference)
  vs HEURÍSTICO (BPM/LQW/pesos sin recalibrar).

Estado detallado y bitácora en [`tasks/ESTADO.md`](./tasks/ESTADO.md).

---

Informes PDF con branding **Meridian Sport Consulting**.
