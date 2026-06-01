# Estado del Proyecto: CourtIQ — Moneyball Analytics

## ⤳ TOGGLE DE SUELDOS + GLOSARIO (2026-05-29)
- **Link**: la app corre LOCAL en http://localhost:3000 (no hay URL pública; falta deploy a Vercel para compartir).
- ✅ **Suspender análisis de sueldos**: interruptor en `/settings`. `SALARY_ENABLED` a nivel de módulo en layer8
  (`analyzePlayer` usa `opts.salaryEnabled ?? flag`). Apagado → salaryNorm=0 (sin penalización, UV=0). Persiste +
  hidrata vía `WeightsHydrator`. UI reacciona: `ValueBadge` muestra UV o MBPVI según el flag; perfil oculta el UV
  y su disclaimer, y cambia la MetricCard UV→TPI; panel oculta el slider de salario y la preview pasa a MBPVI.
  Verificado en vivo (toggle ON↔OFF, persiste, perfil muestra MBPVI 0.610).
- ✅ **Glosario** (`/glosario`): 16 métricas explicadas en criollo (TS%, eFG%, MBPVI, UV, LQW, entropía, arquetipo…)
  con ejemplos. Link en navbar. Verificado en vivo.
- Gate global: lint ✅ · typecheck ✅ · 88 tests ✅ · build ✅ (16 rutas).


## ⤳ GATE DE ACCESO + SIMULADOR DE FICHAJE (2026-05-29)
- ✅ **Gate de acceso por clave** (`AccessGate` en layout, clave `46190963`, persiste en localStorage).
  NOTA: es gate del lado cliente — la clave viaja en el bundle, NO es seguridad real (sirve contra acceso casual).
  Verificado: bloquea, rechaza clave incorrecta, desbloquea con la correcta.
- ✅ **Simulador de fichaje** (`SwapSimulator` en roster-builder): elegís quién sale del quinteto y quién entra
  (del pool muestra+manual) → tabla Antes/Después/Δ de MBPVI, Ataque, Defensa, Rebote, Cohesión y Salario.
  Colores semánticos (verde mejora / rojo empeora; salario invertido). No modifica el roster real.
  Verificado en vivo (Ferreyra→Novak: Defensa ▲+5, Salario ▲+$450k).
- ✅ **Pesos ajustables del modelo** (`/settings` + `WeightsPanel`): 6 sliders (TPI/NRtg/FF/Cohesión/Salario/LQW).
  `ACTIVE_WEIGHTS` a nivel de módulo en layer8 (`analyzePlayer` usa `opts.weights ?? ACTIVE`); `WeightsHydrator`
  aplica los guardados al montar. Persiste en localStorage, recalcula TODA la app. Verificado: w1=0.5/resto=0 → todos MBPVI 0.500.
- ✅ **Notas de scouting** (`ScoutNotes` en perfil): texto libre + tags (sugeridos + custom). Persiste por jugador.
  Verificado: tag "Reboteador" + texto guardados y visibles.
- ✅ **Filtro por arquetipo** (`FilterPanel` + `classifyArchetype` en /search): verificado (Reboteador → Novak/Souza/Radić).
- Gate global: lint ✅ · typecheck ✅ · 88 tests ✅ · build ✅ (15 rutas, +/settings).


## ⤳ FUNCIONES DE SCOUTING (2026-05-29) — 6 de 7 hechas
Tras análisis de gaps + elección del usuario ("todas, de más a menos necesario"):
1. ✅ **Editar/borrar desde UI** — ya estaba en el perfil (jugadores manuales); botones Editar/Borrar.
2. ✅ **Ranking ordenable** — `RankingTable` + toggle Cards/Ranking en /search; ordena por UV/MBPVI/eFG/TS/BPM/TPI/FF.
   Verificado: orden UV desc 2.01→0.72.
3. ✅ **PDF/CSV multi-jugador** — `extractPlayersTable` detecta tabla de plantel en PDF → import en lote;
   CSV ya era multi-fila. `fillStats` completa parciales. +4 tests.
4. ✅ **Contexto vs promedio de liga** — `lib/league-context.ts` (percentiles dentro del pool) + `LeagueContext`
   card en el perfil. +6 tests. Verificado en vivo (P75/P25 con barras de color).
5. ✅ **Comparar quintetos** — `TeamCompare` + tabs Jugadores/Quintetos en /compare (usa rosters guardados).
6. ✅ **Onboarding guiado** — `OnboardingSteps` (3 pasos) en /search cuando no hay jugadores cargados.
7. ⏸️ **Auth + datos por usuario** — PENDIENTE: requiere instancia Supabase + claves (infra externa, no código).
   No se construye a ciegas sin poder verificar. Schema + RLS ya listos en schema.sql.

**Gate global: lint ✅ · typecheck ✅ · 88 tests ✅ · build ✅.** Nota: el dev server necesitó limpiar `.next`
tras muchas ediciones (HMR desincronizado daba 404 en /player/[id]); el build de prod siempre estuvo verde.

## ⤳ CAMBIO DE FUENTE DE DATOS: IA → CARGA MANUAL (2026-05-29)
Por decisión del usuario, se **quitó la búsqueda con IA** y se reemplazó por **carga manual de estadísticas**.
Motivo: no hay API pública/gratis que cubra LNB/NBB/Euroliga; la carga manual cubre todas las ligas sin API key.
- **Borrado:** `app/api/search`, `app/api/ingest`, `lib/ai/search-agent.ts`, `lib/ai/extract-agent.ts` (+16 tests),
  `lib/cache/players.ts`. (Quedan `analyze-agent` y `/api/analyze` para la narrativa opcional del comparador.)
- **Agregado:** `components/players/PlayerForm.tsx` (form con validación), páginas `/players/new` y `/players/[id]/edit`,
  `PlayerProfile`/`EditPlayerClient` (resuelven manual desde localStorage), CRUD de jugadores en `lib/storage/local.ts`
  (`savePlayer`/`getPlayer`/`listPlayers`/`deletePlayer` + snapshot reactivo).
- **Adaptado:** `/search` combina muestra + cargados (sin IA, con CTA "Cargar jugador"); `/player/[id]` soporta manuales;
  `SourceBadge` muestra "Carga manual"; landing + navbar + SearchBar sin referencias a IA.

## ⤳ CARGA AVANZADA: CSV + PDF + export/borrar (2026-05-29)
- **Importar CSV/TSV** (`lib/csv-import.ts` PURO + tests, `components/players/CsvImport.tsx`): pega CSV, detecta
  separador, mapea alias ES/EN, valida por fila (preview OK/error), importa en lote. Reparte `reb` total si falta O/D.
- **Importar PDF con autodetección** (`lib/pdf-extract.ts` PURO + tests, `app/api/extract-pdf/route.ts` con `unpdf`
  server-side, `components/players/PdfUpload.tsx`): sube ficha PDF con texto → heurística detecta nombre+stats por
  etiquetas → PRELLENA el form (nunca guarda solo). Recorta valores de texto al toparse con la próxima etiqueta.
  Honesto: sin IA es best-effort; PDFs escaneados (imagen) avisan que no hay texto. **E2E verificado** (13 campos OK).
- **`NewPlayerTabs`**: pestañas "Carga individual" / "Importar CSV" en `/players/new`; el PDF vive en la carga individual.
- **Exportar CSV** (`lib/csv-export.ts` PURO + tests, round-trip import↔export) y **Borrar datos locales**
  (`clearAllData` + `DataActions` en /search, con confirmación).
- **78/78 tests · lint · typecheck · build** TODO verde (14 rutas, +/api/extract-pdf). `unpdf` agregado.
- **Verificado en vivo (E2E):** cargar jugador → guarda en localStorage → redirige al perfil con las 8 capas + MBPVI
  calculados → aparece en /search ("1 cargado + muestra"). **lint + tsc + 48 tests + build** todo verde.

### Importar CSV + histórico por temporada (2026-05-29) ✅
- **`lib/csv-import.ts`** (parser PURO): coma/tab, comillas, decimales con coma, alias ES/EN de encabezados, reparte
  `reb` total en oreb/dreb, valida por fila (GP>0, conv≤int, numéricos) y reporta errores por línea sin lanzar. **+18 tests → 66.**
- **`CsvImport`** (textarea + preview tabla válidas/errores + import lote) y **`NewPlayerTabs`** (tabs en /players/new).
- **Histórico**: `PlayerForm` permite agregar temporadas anteriores → arma `Player.history` → gráfico `SeasonTrend` en el perfil.
- **Verificado E2E en vivo:** CSV de 3 filas (1 con GP=0) → preview "2 válidas · 1 con error" → import → 2 jugadores en
  /search ("3 cargados + muestra"). Form individual + 1 temporada anterior → perfil con gráfico de evolución
  (12.6→15.0→proy.18.0 PPG, "en ascenso", confianza 50%). **lint + tsc + 66 tests + build** verde (13 rutas).

---

## Plan Activo
Fecha: 2026-05-29 | Estado: Día 1 (Fundaciones) en curso

**Objetivo:** Web app Moneyball para básquet con IA integrada (Claude API + web search).
**Criterio Done (global):** App con búsqueda real, cálculo MBPVI, comparador entre ligas con LQW,
armador de roster y exportación PDF.

**Alcance de esta sesión (Día 1 — Fundaciones):** scaffold + design system + componentes UI base +
sistema de métricas de 8 capas CON TESTS. Es el bloque más denso en lógica y 100% verificable sin API keys.

## Stack real instalado (verificado 2026-05-29)
- **Next.js 16.2.6** (App Router, RSC) — ver "Decisiones" sobre por qué no es 14.
- **React 19.2.4**
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (CSS-first, sin `tailwind.config.ts`) — ver "Decisiones".
- Deps de features: `@anthropic-ai/sdk`, `framer-motion`, `swr`, `@supabase/supabase-js`, `zod`,
  `recharts`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@react-pdf/renderer`.
- Test runner: **Vitest** (corre `.ts` nativo vía esbuild).

## Tareas
### Día 1 — Fundaciones ✅ COMPLETO (2026-05-29)
- [x] Scaffold Next.js + TS + Tailwind
- [x] `tasks/ESTADO.md`
- [x] Tipos base (`types/`: metrics, league, player, team)
- [x] Design system (`app/globals.css` @theme + Oswald/Space Mono/DM Sans + grid + focus + reduced-motion)
- [x] Componentes UI base (Button, Card, Badge, Input, Skeleton) + `lib/utils/cn.ts`
- [x] Sistema de métricas 8 capas (`lib/moneyball/`) + LQW + integrador `analyzePlayer`
- [x] Tests: 36 casos en 5 archivos `*.test.ts` (incluye guards división-por-cero) — **36/36 verde**
- [x] Landing page con identidad visual (hero + SearchBar animada + StatCounter + feature cards)
- [x] `tsc --noEmit` verde · `next build` verde · verificación visual con preview (captura OK)

**Cómo correr:** `cd courtiq` → `npm run dev` (o `npm test` / `npm run typecheck` / `npm run build`).
Nota PATH: si `node` no se reconoce, reabrir terminal tras instalar Node, o usar `dev-preview.cmd`.

### Día 2 — IA y API ✅ COMPLETO (2026-05-29)
- [x] `lib/env.ts` — validación Zod LAZY (no rompe build sin `.env.local`)
- [x] `lib/ai/client.ts` (singleton + modelo), `lib/ai/streaming.ts` (SSE), `lib/rate-limit.ts`
- [x] `lib/ai/search-agent.ts` — `client.messages.stream` + web_search **GA** (`web_search_20260209`) + prompt caching
- [x] `lib/ai/analyze-agent.ts` — narrativa no-streaming con system cacheado
- [x] `lib/validation.ts` — esquemas Zod (analyze/predict/compare)
- [x] `lib/supabase/client.ts` + `lib/supabase/schema.sql` + `.env.local.example`
- [x] API routes: `search` (SSE + rate-limit + timeout), `analyze`, `predict`, `compare`, `export-pdf` (stub Día 4)
- [x] `tsc` verde · `next build` verde (5 rutas ƒ) · 36/36 tests · smoke-test live de `analyze` y `predict` OK

**Decisiones Día 2 (importantes):**
- **web_search es GA en el SDK 0.100**, no beta. Se usa `client.messages.stream` + tool `web_search_20260209`,
  SIN `client.beta.*` ni `betas:['web-search-2025-03-05']`. El spec asumía un SDK anterior — corregido y documentado.
- **Modelo runtime: `claude-sonnet-4-6`** (no el `claude-sonnet-4-20250514` del spec, que está deprecado).
  Configurable vía `ANTHROPIC_MODEL`. Sonnet por costo (endpoint de búsqueda de alto volumen), per estrategia del usuario.
- **Runtime `nodejs`, no edge** (el spec pedía edge para search): el rate-limit in-memory y el streaming necesitan
  proceso persistente. Edge es posible pero el rate-limit no sería confiable entre isolates. Documentado.
- **env validation LAZY** (no al import): validar al top-level rompería `next build`/`dev` sin `.env.local`.
- Endpoints deterministas (`analyze`, `predict`, `compare`) funcionan **sin API key**; la narrativa IA es best-effort.

### Día 3 — Páginas principales ✅ COMPLETO (2026-05-29)
- [x] `lib/sample-data.ts` (6 jugadores ficticios de muestra + SALARY_MAX por liga) y `lib/radar.ts`
- [x] Componentes analytics: `UVScoreBadge`, `MetricCard`, `MetricBar` (animada), `RadarChart` (recharts), `LayerSystem` (8 capas)
- [x] Componentes search: `FilterPanel`, `PlayerResultCard`, `SearchExperience` (filtros + SSE en vivo)
- [x] `components/layout/Navbar.tsx` integrado en el layout raíz
- [x] `app/search/page.tsx` (server, `await searchParams`) y `app/player/[id]/page.tsx` (server, `await params`)
- [x] `tsc` + `next build` verde (7 rutas) · 36/36 tests · verificación visual: /search (cards + semáforo UV) y /player/[id] (radar + 8 capas)

**Decisiones Día 3:**
- **Dataset de muestra** (`SAMPLE_PLAYERS`, ficticios, marcados "muestra" en UI): permite que /search y /player rindan
  métricas reales sin backend ni API key. Los datos reales vendrán de búsqueda IA + caché Supabase.
- **Search híbrido**: panel "IA en vivo" consume el SSE de `/api/search` (requiere key, falla con mensaje claro) +
  grilla de jugadores del dataset filtrable en cliente (analyzePlayer es puro, corre en el browser).
- **recharts**: colores hex literales (los `var()` CSS no son fiables en atributos de presentación SVG).
- Verificado el semáforo UV en vivo: 1.64→dorado, 0.72→rojo, 1.02→blanco, 2.01→dorado.

### Día 4 — Roster, comparador UI, PDF ✅ COMPLETO (2026-05-29)
- [x] `lib/archetype.ts` (clasificación rule-based) + `lib/roster.ts` (entropía/HHI/sectores) + tests (42/42)
- [x] Roster: `RosterBuilder` (`@dnd-kit/core` drag&drop), `CourtSVG` (media cancha), `ArchetypeTag`, `TeamEntropy` + "Sugerir refuerzo"
- [x] `app/roster-builder/page.tsx` — verificado: cancha + 6 chips draggable + 5 slots
- [x] `components/compare/CompareExperience.tsx` + `app/compare/page.tsx` — bar chart (recharts) + tabla con ganador por métrica + normalización LQW
- [x] `lib/pdf/report-generator.tsx` (@react-pdf/renderer, branding Meridian Sport) + `app/api/export-pdf/route.ts` real + `ExportPdfButton` en perfil
- [x] `tsc` + `next build` verde (7 rutas) · verificado: comparador (ganadores correctos), PDF (`%PDF`, 4180 bytes, 200)

**Decisiones / hallazgos Día 4:**
- **recharts `ResponsiveContainer` + gate `mounted` = charts no renderizan** en el renderer headless (el ResizeObserver
  no dispara para contenedores montados post-paint). Se revirtió el gate; el warning de tamaño-0 en SSR es solo build-time
  y benigno. Lección registrada.
- El screenshot del preview se cuelga en páginas con recharts activo (loop de ResizeObserver mantiene ocupado el compositor);
  verificación hecha vía DOM (`preview_eval`) — chart con 8 barras, tabla con ganadores correctos.
- Arquetipos verificados: Souza→Reboteador, Domínguez→Creador. Comparador: MBPVI/UV ganados por Domínguez (salario menor + bonus liga).

### Día 5 — QA final ✅ COMPLETO (2026-05-29)
- [x] **Accesibilidad**: corregido el bug de focus ring (los `focus:outline-none` ganaban al `:focus-visible`
      global por especificidad de `:where()`) en Input, SearchBar, SearchExperience, selects de Compare y
      PlayerResultCard → keyboard focus ring restaurado en todos los interactivos.
- [x] Landmark `<main>` agregado a /search (las demás ya lo tenían). Navbar → estado activo con `aria-current="page"`.
- [x] Contraste verificado (ink-muted #8a8aa3 sobre base ≈ 5.9:1, pasa AA). `prefers-reduced-motion` global. Sin `outline:none` sin reemplazo.
- [x] **Responsive** verificado a 375px (landing + perfil): Navbar, hero, search, header/export y radar reflowean OK.
- [x] **Sin `console.log`** en el código fuente. `next build` verde (7 rutas) · 42/42 tests · `tsc` limpio.
- [x] `README.md` completo (stack, arquitectura, 8 capas, LQW, scripts, desviaciones documentadas).

**Nota perf:** warning benigno de recharts (tamaño-0 en prerender SSR de /compare) — solo build-time, no afecta runtime.
El screenshot del preview headless se cuelga en páginas con recharts; verificación hecha vía DOM (`preview_eval`).

---
## 🏁 PROYECTO COMPLETO (Días 1–5)
App funcional: landing, búsqueda (filtros + IA SSE), perfil con radar + 8 capas + export PDF, comparador entre
ligas (LQW), armador de roster (dnd-kit + entropía/HHI). 5 API routes. Sistema de métricas 8 capas con 42 tests.
Build/typecheck/tests en verde.

## POST-PROYECTO — Consejo + Pipeline de datos reales (2026-05-29)
Se pasó el proyecto por el skill `council` (3 perspectivas: arquitecta / estratega / escéptico de dominio).
**Veredicto:** el cuello de botella no son más features sino **confiabilidad de datos** — cerrar el loop (a)
y robustez (c) son inseparables; regla de oro: `null` antes que inventar, ningún número sin fuente + confianza.

Implementado #1 + #2 del veredicto:
- [x] `lib/ai/extract-agent.ts`: extracción ESTRUCTURADA (web search → JSON validado con Zod → `PlayerStats`).
      Funciones puras testeables: `extractJsonBlock`, `parseExtraction`, `toPlayerStats` (per-game→gp=1/min=mpg),
      `statsCompleteness`, `extractedToPlayer` (confianza = min(modelo, completitud); null si <0.5 core). **+16 tests.**
- [x] `lib/cache/players.ts`: read-through cache (Map en memoria + write-through best-effort a Supabase).
- [x] `app/api/ingest/route.ts`: read-through → extracción → cache. Sin key degrada con 503 claro.
- [x] Trust UI: `SourceBadge` (fuente+fecha+confianza con semáforo) en result cards y perfil; disclaimer UV
      "señal, no veredicto"; nota "métricas sobre promedios por partido"; `/player/[id]` lee del cache.
- [x] `SearchExperience` ahora usa `/api/ingest` (resultado real con fuente/confianza, no texto libre).
- [x] **58/58 tests** · `tsc` + `next build` verde (8 rutas). Verificado: ingest sin key → 503; 6 result cards con badge "Datos de muestra".

**Limitación honesta:** el E2E real (web search → jugador) requiere `ANTHROPIC_API_KEY` + red (no ejercitado acá);
toda la lógica alrededor está construida y unit-tested, y el camino sin key degrada limpio.

### Recomendación #1 del consejo — Validación + disclosure de calibración ✅ (2026-05-29)
- [x] `lib/moneyball/validation.test.ts`: valida TS%/eFG%/3PAr/FTr contra **Curry 2015-16 (Basketball-Reference)**
      (.669/.630/.555/.250, tolerancia 2 decimales) + tests de identidad de fórmula a precisión exacta. **+6 tests → 64 total.**
- [x] `lib/moneyball/calibration.ts` + `components/analytics/MethodologyCard.tsx`: disclosure honesto EXACTO vs HEURÍSTICO.
      Marca explícitamente: BPM/VORP (coeffs NBA sin recalibrar), LQW (a mano), FF_Score (pesos a mano), MBPVI (constantes ajustables).
- [x] Card "Metodología y calibración" en `/player/[id]` — verificado en vivo (chips EXACTO×/HEURÍSTICO× + disclaimer UV).
- [x] 64/64 tests · `tsc` + `build` verde.

### Retención + persistencia ✅ (2026-05-29)
- [x] `lib/storage/local.ts`: persistencia localStorage (rosters guardados + watchlist) con write-through best-effort
      a Supabase. SSR-safe.
- [x] **Rosters guardados**: Guardar/cargar/borrar quintetos en roster-builder (chips).
- [x] **Watchlist + alertas UV**: `WatchButton` (en perfil), `/watchlist` con delta de UV desde que se agregó
      (▲ sube / ▼ baja / = igual). Link en navbar.
- [x] **Compartir por URL**: `ShareButton` copia link; comparador (`?a=&b=&to=`) y roster (`?l=`) restauran estado.
- [x] **Histórico por temporada**: `Player.history` + `SeasonTrend` (LineChart PPG + proyección vía `/api/predict`).
      Histórico de muestra para Domínguez y Souza.
- [x] **Dark/Light toggle**: `ThemeToggle` + tokens `[data-theme="light"]` en globals.css + anti-FOUC script en layout.
      UVScoreBadge migrado a CSS var por tono (se adapta al tema; el hex queda solo para el PDF).
- [x] **64/64 tests** · `tsc` + `build` verde (9 rutas, +/watchlist). Verificado en vivo: toggle tema (persiste),
      watchlist (delta ▲), share-URL roster (lineup restaurado).

**Limitación honesta:** persistencia primaria es localStorage (por navegador). El write-through a Supabase y la
auth real quedan para cuando haya instancia Supabase configurada — el schema + RLS ya están listos en schema.sql.

### Endurecimiento de producción ✅ (2026-05-29)
- [x] **Lint limpio** (0 errores / 0 warnings). 6 errores `react-hooks/set-state-in-effect` corregidos BIEN, no con
      disables ciegos: Watchlist + rosters → **store reactivo** con `useSyncExternalStore` (subscribe/emit/snapshots
      en `lib/storage/local.ts`; sincroniza entre componentes y pestañas). `ThemeToggle` → useSyncExternalStore sobre
      `data-theme`. `StatCounter` → reduced-motion derivado. Reads de URL → efecto post-mount con disable justificado
      (evita hydration mismatch). Quitado import sin usar.
- [x] **Error boundary** `app/error.tsx` (prop `unstable_retry` de Next 16) · **loading** `app/loading.tsx` (skeletons)
      · **not-found** `app/not-found.tsx` — verificado en vivo (404 on-brand con CTAs).
- [x] **lint + tsc + 64 tests + build** TODO verde (9 rutas).

## ✅ TODO EL ROADMAP DEL CONSEJO IMPLEMENTADO
(a) datos reales [pipeline ingesta] · (c) confiabilidad [validación Curry + disclosure calibración] ·
(b) producto [rosters guardados, watchlist+alertas, share, histórico, tema] · + endurecimiento de producción.
**Pendiente solo (requiere infra externa, no código):** instancia Supabase en vivo + auth real, `ANTHROPIC_API_KEY`
para el E2E de ingesta, y recalibración empírica de BPM/LQW cuando haya volumen de datos reales.

## Decisiones de arquitectura
1. **Next.js 16, no 14.** El prompt pedía "Next.js 14 (no negociable)" pero el comando de bootstrap usaba
   `create-next-app@latest`, que con Node 24 instala Next 16. Next 16 soporta todo lo exigido (App Router,
   RSC, streaming, `next.config.ts`, Server Actions, Edge). Se eligió `@latest` por ser la rama mantenida.
   Si se requiere Next 14 exacto por restricción de despliegue, hay que re-scaffoldear con `create-next-app@14`.
2. **Sin `tailwind.config.ts`.** Tailwind v4 es CSS-first: los design tokens viven en `@theme` dentro de
   `app/globals.css`. El spec pedía `tailwind.config.ts` (era Tailwind v3). Se documenta como deviación.
3. **`params`/`searchParams` son `Promise` en Next 16** — las páginas dinámicas (`player/[id]`) deben
   `await params`. Se respeta al construir esas páginas (Día 3).
4. **Vitest como runner.** El spec no fijaba runner; Vitest corre TS nativo y es estándar de facto.
5. **Normalización de inputs del MBPVI.** `calcMBPVI` se implementa EXACTAMENTE como el spec (suma ponderada
   pura, testeable con valores conocidos). El integrador `analyzePlayer` normaliza cada componente a escalas
   comparables [0,1] con constantes de calibración documentadas en `layer8-mbpvi.ts` (heurísticas, ajustables
   con datos reales). Esto evita que `NRtg` (~±20) domine sobre `FF_Score` (~0–1).

## Lecciones
- El proyecto trae `AGENTS.md` (Next 16) indicando leer `node_modules/next/dist/docs/` antes de codear:
  conventions cambiaron (fuentes, CSS v4, params async). Se leyeron fonts/css/layouts/upgrading antes de escribir.
- Node no estaba instalado; se instaló Node 24.16.0 LTS vía winget. El PATH no refresca en la sesión activa:
  hay que reabrir terminal o recargar `$env:Path` desde Machine+User.
