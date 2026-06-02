# CourtIQ — Guía de uso

Análisis Moneyball para básquet. Esta guía explica, en simple, cómo usar cada parte.

**App en vivo:** https://courtiq-coral.vercel.app
**Clave de acceso:** 46190963

---

## 1. Entrar

1. Abrí el link.
2. Escribí la clave `46190963` → Ingresar.
3. (La clave queda guardada en ese navegador; no la pide de nuevo.)

> Nota: la clave es un candado simple del lado del navegador, no seguridad fuerte. Sirve para que no entre cualquiera de casualidad.

---

## 2. Cargar jugadores (menú "Cargar")

Hay tres formas. Todas calculan automáticamente las 8 capas de métricas.

### a) Carga individual
Llenás el formulario con las estadísticas de temporada (PJ, minutos, puntos, tiros, etc.) y CourtIQ calcula el resto.

### b) Importar CSV
Pegás una tabla CSV o TSV (de tu planilla). Detecta el separador y los nombres de columna en español o inglés. Te muestra una previsualización con los válidos y los errores por fila antes de importar.

### c) Importar PDF (planilla LNB / Liga Argentina)
1. En "Carga individual", arriba está "Autocompletar desde PDF".
2. Elegí el PDF oficial de estadísticas (ej. el de la LNB).
3. Detecta a todos los jugadores de la tabla (289, 472, etc.).
4. Elegí la **Liga** y **Temporada** y dale Importar.

**Importante sobre el PDF:**
- La **posición** se estima del perfil estadístico (la planilla no la trae). Es una aproximación: revisala.
- El **equipo** queda en "—" (la planilla no lo trae). Lo completás después.
- Re-importar la misma planilla **no duplica**: actualiza los que ya estaban.

---

## 3. Buscar y rankear (menú "Jugadores")

- **Filtro** por nombre/equipo, liga, posición, arquetipo, edad, UV Score mínimo, eFG%, DREB%.
- **Dos vistas:** "Cards" (tarjetas) o "Ranking" (tabla ordenable por UV, MBPVI, eFG%, BPM, TPI, etc. — clic en la columna para ordenar).
- Cada jugador muestra su **UV Score** con semáforo:
  - 🟢 Verde (>2.5): objetivo prioritario
  - 🟡 Dorado (1.5–2.5): buena inversión
  - ⚪ Blanco (0.8–1.5): precio justo
  - 🔴 Rojo (<0.8): sobrevalorado

---

## 4. Perfil del jugador

Clic en cualquier jugador. Vas a ver:
- **UV Score** grande con explicación.
- **Radar** de 6 dimensiones.
- **Contexto de liga**: en qué percentil está cada métrica vs los otros de su liga.
- **Las 8 capas Moneyball** en detalle (tiro, posesiones, Four Factors, TPI, BPM, MBPVI).
- **Evolución por temporada** (si cargaste histórico).
- **Metodología**: qué métricas son exactas y cuáles heurísticas (transparencia).
- Botones: Seguir, Exportar PDF, Editar, Borrar (estos últimos en jugadores cargados).

---

## 5. Comparar (menú "Comparar")

- **Jugadores:** elegí 2, se normalizan entre ligas con el LQW (League Quality Weight). Tabla con el ganador por métrica.
- **Quintetos:** compará dos rosters guardados lado a lado.

---

## 6. Armador de Roster (menú "Roster")

- Arrastrá jugadores (de muestra + los que cargaste) a las 5 posiciones de la cancha.
- **Filtros** del pool: liga, arquetipo, edad, nombre. (Para "tiradores sub-21": filtro Edad máx → 21, Arquetipo → Tirador.)
- Calcula en vivo: entropía del equipo, HHI, fortalezas por sector.
- **Simulador de fichaje:** ver cómo cambian las métricas si reemplazás un jugador.
- **Guardar** y **Compartir** el quinteto por link.

---

## 7. Seguimiento (menú "Seguimiento")

Seguí jugadores con "+ Seguir" en su perfil. La página muestra el cambio de UV Score desde que lo agregaste (▲ subió / ▼ bajó).

---

## 8. Calibración (menú "Calibración")

- **Pesos del MBPVI:** ajustá cuánto pesa cada componente del índice de valor a tu criterio/liga. Se aplica en toda la app.
- **Interruptor "Análisis de sueldos":** apagalo para ignorar el salario. La app pasa a rankear por MBPVI puro (rendimiento sin importar el costo) y oculta el UV Score. Útil cuando no tenés el dato salarial (como los datos de la LNB).
- **Estado de la nube:** diagnóstico de la conexión a Supabase.

---

## 9. Gestionar jugadores en lote ("Gestionar (N)" desde la búsqueda)

Tras importar una planilla, seleccioná varios jugadores y cambiales liga / temporada / equipo / posición de una sola vez, o borralos en lote. Ideal para asignar el equipo a todos los de un club después de importar.

---

## 10. Datos: exportar y borrar (en la búsqueda)

- **Exportar CSV:** baja todos tus jugadores (se puede re-importar idéntico).
- **Borrar datos locales:** limpia todo (jugadores, rosters, seguimiento).

---

## Notas honestas

- **Dónde se guardan tus datos:** por defecto, en el navegador (localStorage). Si Supabase está configurado en el servidor, además se sincronizan en la nube y se comparten entre dispositivos/personas con la clave.
- **Las métricas son una señal, no un veredicto.** El UV Score detecta candidatos a revisar; no decide fichajes por vos. Algunos coeficientes (BPM, LQW) son heurísticos, marcados como tal en la app.
- **Tema claro/oscuro:** el botón ☀/☾ del navbar.
