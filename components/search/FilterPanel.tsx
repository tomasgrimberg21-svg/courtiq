"use client";

import type { Position } from "@/types/player";
import type { Archetype } from "@/types/team";

export interface Filters {
  leagues: string[];
  positions: Position[];
  archetypes: Archetype[];
  ageMax: number;
  uvMin: number;
  efgMin: number;
  drebMin: number;
}

export const DEFAULT_FILTERS: Filters = {
  leagues: [],
  positions: [],
  archetypes: [],
  ageMax: 40,
  uvMin: 0,
  efgMin: 0,
  drebMin: 0,
};

const LEAGUES = ["LNB", "NBA", "EuroLeague", "ACB", "NBB", "Liga Uruguaya"];
const POSITIONS: Position[] = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];
const ARCHETYPES: Archetype[] = [
  "Creador", "Tirador", "Slasher", "Defensor Perimetral",
  "Reboteador", "Protector de Aro", "Stretch Big", "Glue Guy",
];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <aside className="flex flex-col gap-6" aria-label="Filtros de búsqueda">
      <fieldset>
        <legend className="font-heading text-sm uppercase text-ink-muted">Liga</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {LEAGUES.map((l) => (
            <label key={l} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="accent-brand"
                checked={filters.leagues.includes(l)}
                onChange={() => set({ leagues: toggle(filters.leagues, l) })}
              />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-heading text-sm uppercase text-ink-muted">Posición</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {POSITIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="accent-brand"
                checked={filters.positions.includes(p)}
                onChange={() => set({ positions: toggle(filters.positions, p) })}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-heading text-sm uppercase text-ink-muted">Arquetipo</legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {ARCHETYPES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="accent-brand"
                checked={filters.archetypes.includes(a)}
                onChange={() => set({ archetypes: toggle(filters.archetypes, a) })}
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <Slider label="Edad máx." value={filters.ageMax} min={18} max={40} onChange={(v) => set({ ageMax: v })} />
      <Slider label="UV Score mín." value={filters.uvMin} min={0} max={5} step={0.1} fixed={1} onChange={(v) => set({ uvMin: v })} />
      <Slider label="eFG% mín." value={filters.efgMin} min={0} max={70} suffix="%" onChange={(v) => set({ efgMin: v })} />
      <Slider label="DREB% mín." value={filters.drebMin} min={0} max={40} suffix="%" onChange={(v) => set({ drebMin: v })} />
    </aside>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  fixed = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  fixed?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="font-heading text-sm uppercase text-ink-muted">{label}</label>
        <span className="font-numeric text-sm text-brand">
          {value.toFixed(fixed)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        className="mt-2 w-full accent-brand"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
