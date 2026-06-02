"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SAMPLE_PLAYERS } from "@/lib/sample-data";
import { computeRosterMetrics } from "@/lib/roster";
import { classifyArchetype } from "@/lib/archetype";
import { calcDrebPct, calcPOSS, calcEFG, safeDiv, clamp } from "@/lib/moneyball";
import type { Player, Position } from "@/types/player";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MetricBar } from "@/components/analytics/MetricBar";
import { MetricCard } from "@/components/analytics/MetricCard";
import { RadarChart } from "@/components/analytics/RadarChart";
import { ArchetypeTag } from "./ArchetypeTag";
import { TeamEntropy } from "./TeamEntropy";
import { CourtSVG } from "./CourtSVG";
import { SwapSimulator } from "./SwapSimulator";
import { ShareButton } from "@/components/common/ShareButton";
import { saveRoster, deleteRoster, subscribe, getRostersSnapshot, getPlayersSnapshot } from "@/lib/storage/local";
import { parseSearchCommand } from "@/lib/search-command";
import type { Archetype } from "@/types/team";

const ROSTER_LEAGUES = ["LNB", "Liga Provincial ARG", "NBB", "ACB", "EuroLeague", "NBA", "Liga Uruguaya"];
const ROSTER_ARCHETYPES: Archetype[] = [
  "Creador", "Tirador", "Slasher", "Defensor Perimetral",
  "Reboteador", "Protector de Aro", "Stretch Big", "Glue Guy",
];

const SLOT_ORDER: Position[] = ["Pívot", "Ala-Pívot", "Alero", "Escolta", "Base"];
const SLOT_POS: Record<Position, { top: string; left: string }> = {
  Pívot: { top: "15%", left: "52%" },
  "Ala-Pívot": { top: "33%", left: "26%" },
  Alero: { top: "40%", left: "76%" },
  Escolta: { top: "64%", left: "30%" },
  Base: { top: "83%", left: "60%" },
};

function PlayerChip({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: player.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex cursor-grab touch-none items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2 active:cursor-grabbing"
    >
      <div className="min-w-0">
        <div className="truncate text-sm text-ink">{player.name}</div>
        <div className="text-[10px] text-ink-muted">
          {player.position} · {player.league}
        </div>
      </div>
      <ArchetypeTag archetype={classifyArchetype(player)} />
    </div>
  );
}

function Slot({ pos, player, onClear }: { pos: Position; player: Player | null; onClear: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: pos });
  return (
    <div
      ref={setNodeRef}
      className="absolute w-32 -translate-x-1/2 -translate-y-1/2"
      style={SLOT_POS[pos]}
    >
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-2 text-center transition-colors",
          isOver ? "border-brand bg-brand/15" : "border-line bg-base/70",
          player && "border-solid border-brand/50 bg-panel/90",
        )}
      >
        <div className="text-[10px] uppercase tracking-wide text-ink-muted">{pos}</div>
        {player ? (
          <>
            <div className="truncate text-xs text-ink">{player.name}</div>
            <div className="mt-1 flex justify-center">
              <ArchetypeTag archetype={classifyArchetype(player)} />
            </div>
            <button onClick={onClear} className="mt-1 text-[10px] text-uv-red hover:underline">
              Quitar
            </button>
          </>
        ) : (
          <div className="py-2 text-[10px] text-ink-muted">soltá acá</div>
        )}
      </div>
    </div>
  );
}

export function RosterBuilder() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const [slots, setSlots] = useState<Partial<Record<Position, string>>>({});
  // Rosters guardados: store reactivo (se actualiza al guardar/borrar sin setState-in-effect).
  const saved = useSyncExternalStore(subscribe, getRostersSnapshot, getRostersSnapshot);
  // Jugadores importados/cargados (reactivo). El pool del armador = muestra + cargados.
  const manualPlayers = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const pool = useMemo(() => {
    const all = [...manualPlayers, ...SAMPLE_PLAYERS];
    // Dedup por id (por si un manual comparte id con muestra).
    return all.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  }, [manualPlayers]);
  const resolve = (pid: string): Player | undefined => pool.find((p) => p.id === pid);

  // Filtros del pool de disponibles.
  const [fLeague, setFLeague] = useState("");
  const [fArch, setFArch] = useState<Archetype | "">("");
  const [fAgeMax, setFAgeMax] = useState(40);
  const [fQuery, setFQuery] = useState("");
  const [cmdHint, setCmdHint] = useState<string | null>(null);

  // La barra entiende comandos: "u21 tiradores", "pívots lnb" → aplica filtros automáticamente.
  function onQueryChange(raw: string) {
    setFQuery(raw);
    const cmd = parseSearchCommand(raw);
    const applied: string[] = [];
    if (cmd.ageMax !== undefined) { setFAgeMax(cmd.ageMax); applied.push(`edad ≤ ${cmd.ageMax}`); }
    if (cmd.archetype) { setFArch(cmd.archetype); applied.push(cmd.archetype); }
    if (cmd.league) { setFLeague(cmd.league); applied.push(cmd.league); }
    setCmdHint(applied.length ? `Aplicado: ${applied.join(" · ")}` : null);
  }

  // Lineup desde la URL (?l=) para compartir. Post-mount a propósito: evita hydration mismatch
  // en esta página prerenderizada (window solo existe en cliente).
  useEffect(() => {
    try {
      const l = new URLSearchParams(window.location.search).get("l");
      if (l) {
        const parsed = JSON.parse(decodeURIComponent(l));
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSlots(parsed as Partial<Record<Position, string>>);
        }
      }
    } catch {
      /* URL inválida → ignorar */
    }
  }, []);

  const assignedIds = Object.values(slots).filter(Boolean) as string[];
  const available = useMemo(() => {
    // Solo el texto sobrante del comando filtra por nombre (ej. "u21 tiradores" → texto vacío).
    const q = parseSearchCommand(fQuery).text.toLowerCase();
    return pool.filter((p) => {
      if (assignedIds.includes(p.id)) return false;
      if (fLeague && p.league !== fLeague) return false;
      if (fArch && classifyArchetype(p) !== fArch) return false;
      if (p.age !== undefined && p.age > fAgeMax) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pool, assignedIds, fLeague, fArch, fAgeMax, fQuery]);

  // Cuántos del pool no tienen edad cargada (relevante cuando se filtra por edad).
  const withoutAge = useMemo(() => pool.filter((p) => p.age === undefined).length, [pool]);
  const rosterPlayers = SLOT_ORDER.map((pos) => (slots[pos] ? resolve(slots[pos]!) : undefined)).filter(
    (p): p is Player => Boolean(p),
  );

  const metrics = useMemo(() => computeRosterMetrics(rosterPlayers), [rosterPlayers]);
  const totalSalary = rosterPlayers.reduce((a, p) => a + (p.stats.salary ?? 0), 0);

  function buildShareUrl(): string {
    return `${window.location.origin}/roster-builder?l=${encodeURIComponent(JSON.stringify(slots))}`;
  }
  function doSave() {
    const name = window.prompt("Nombre del quinteto:", "Mi quinteto");
    if (name === null) return;
    saveRoster(name, slots); // emit() actualiza el store → re-render automático
  }
  function doDelete(rid: string) {
    deleteRoster(rid);
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const playerId = String(e.active.id);
    const pos = e.over.id as Position;
    setSlots((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next) as Position[]) if (next[k] === playerId) delete next[k];
      next[pos] = playerId;
      return next;
    });
  }

  /** Sugiere un refuerzo: jugador disponible que más aporta al sector más débil. */
  function suggestReinforcement() {
    if (!metrics || available.length === 0) return;
    const weakest = (["attack", "defense", "rebound"] as const).reduce((w, s) =>
      metrics[s] < metrics[w] ? s : w,
    );
    const score = (p: Player) => {
      if (weakest === "attack") return calcEFG(p.stats);
      if (weakest === "rebound") return calcDrebPct(p.stats);
      return safeDiv(p.stats.stl + p.stats.blk, calcPOSS(p.stats));
    };
    const best = [...available].sort((a, b) => score(b) - score(a))[0]!;
    const targetPos = !slots[best.position] ? best.position : SLOT_ORDER.find((pos) => !slots[pos]);
    if (!targetPos) return;
    setSlots((prev) => ({ ...prev, [targetPos]: best.id }));
  }

  const teamRadar = metrics
    ? [
        { axis: "Ataque", value: metrics.attack },
        { axis: "Defensa", value: metrics.defense },
        { axis: "Rebote", value: metrics.rebound },
        { axis: "Eficiencia", value: clamp(metrics.ffScoreAvg * 120, 0, 100) },
        { axis: "Cohesión", value: metrics.entropy * 100 },
        { axis: "Valor", value: clamp(metrics.mbpviAvg * 150, 0, 100) },
      ]
    : [];

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={doSave} disabled={rosterPlayers.length === 0}>
          Guardar quinteto
        </Button>
        <ShareButton getUrl={buildShareUrl} label="Compartir quinteto" />
        {saved.length > 0 && <span className="ml-1 text-xs text-ink-muted">Guardados:</span>}
        {saved.map((r) => (
          <span key={r.id} className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2 py-1 text-xs">
            <button onClick={() => setSlots(r.slots)} className="text-ink hover:text-brand">
              {r.name}
            </button>
            <button onClick={() => doDelete(r.id)} aria-label={`Borrar ${r.name}`} className="text-uv-red">
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Disponibles + filtros */}
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm uppercase text-ink-muted">
            Disponibles ({available.length})
          </h2>

          {/* Filtros del pool */}
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-panel/60 p-3">
            <input
              type="search"
              value={fQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder='Nombre, o comando: "u21 tiradores", "pívots lnb"…'
              className="h-9 rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand"
              aria-label="Filtrar por nombre o comando"
            />
            {cmdHint && <span className="text-[11px] text-brand">{cmdHint}</span>}
            <select
              value={fLeague}
              onChange={(e) => setFLeague(e.target.value)}
              aria-label="Filtrar por liga"
              className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand"
            >
              <option value="">Todas las ligas</option>
              {ROSTER_LEAGUES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              value={fArch}
              onChange={(e) => setFArch(e.target.value as Archetype | "")}
              aria-label="Filtrar por arquetipo"
              className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand"
            >
              <option value="">Todos los arquetipos</option>
              {ROSTER_ARCHETYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <label className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between text-xs text-ink-muted">
                <span>Edad máx.</span>
                <span className="font-numeric text-brand">{fAgeMax}</span>
              </span>
              <input
                type="range"
                min={16}
                max={40}
                value={fAgeMax}
                onChange={(e) => setFAgeMax(Number(e.target.value))}
                className="w-full accent-brand"
                aria-label="Edad máxima"
              />
            </label>
            {fAgeMax < 40 && withoutAge > 0 && (
              <p className="text-[11px] text-uv-gold">
                ⚠ {withoutAge} jugador{withoutAge === 1 ? "" : "es"} sin edad cargada se muestran igual. Cargá la edad
                en <a href="/players/manage" className="underline">Gestionar</a> para que el filtro los excluya.
              </p>
            )}
            {(fLeague || fArch || fQuery || fAgeMax < 40) && (
              <button
                onClick={() => { setFLeague(""); setFArch(""); setFQuery(""); setFAgeMax(40); setCmdHint(null); }}
                className="self-start text-xs text-ink-muted underline hover:text-ink"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
            {available.map((p) => (
              <PlayerChip key={p.id} player={p} />
            ))}
            {available.length === 0 && (
              <p className="text-xs text-ink-muted">
                {pool.length <= SAMPLE_PLAYERS.length
                  ? "Sin jugadores con esos filtros."
                  : "Ningún jugador coincide. Probá limpiar filtros."}
              </p>
            )}
          </div>
        </div>

        {/* Cancha */}
        <div>
          <div className="relative mx-auto aspect-[300/380] max-w-md">
            <CourtSVG />
            {SLOT_ORDER.map((pos) => (
              <Slot
                key={pos}
                pos={pos}
                player={slots[pos] ? resolve(slots[pos]!) ?? null : null}
                onClear={() => setSlots((prev) => {
                  const n = { ...prev };
                  delete n[pos];
                  return n;
                })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Análisis */}
      {metrics ? (
        <section className="mt-10 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-ink">Análisis del lineup</h2>
            <Button variant="outline" size="sm" onClick={suggestReinforcement} disabled={available.length === 0}>
              Sugerir refuerzo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Jugadores" value={rosterPlayers.length} />
            <MetricCard label="MBPVI prom." value={metrics.mbpviAvg.toFixed(3)} />
            <MetricCard label="FF_Score prom." value={metrics.ffScoreAvg.toFixed(3)} />
            <MetricCard label="Salario total" value={`$${(totalSalary / 1000).toFixed(0)}k`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <h3 className="font-heading text-sm uppercase text-ink-muted">Perfil del equipo</h3>
              <RadarChart data={teamRadar} />
            </Card>
            <div className="flex flex-col gap-4">
              <TeamEntropy metrics={metrics} />
              <Card className="flex flex-col gap-3">
                <h3 className="font-heading text-sm uppercase text-ink-muted">Sectores</h3>
                <MetricBar label="Ataque" display={metrics.attack.toFixed(0)} pct={metrics.attack} />
                <MetricBar label="Defensa" display={metrics.defense.toFixed(0)} pct={metrics.defense} />
                <MetricBar label="Rebote" display={metrics.rebound.toFixed(0)} pct={metrics.rebound} />
              </Card>
            </div>
          </div>

          <SwapSimulator roster={rosterPlayers} />
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-ink-muted">
          Arrastrá jugadores a las posiciones para ver el análisis del equipo.
        </p>
      )}
    </DndContext>
  );
}
