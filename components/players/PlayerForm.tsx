"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Player, Position } from "@/types/player";
import type { PlayerStats } from "@/types/metrics";
import type { PdfDetection } from "@/lib/pdf-extract";
import { savePlayer } from "@/lib/storage/local";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PdfUpload } from "./PdfUpload";

const LEAGUES = ["LNB", "NBA", "EuroLeague", "ACB", "NBB", "Liga Uruguaya", "Liga Provincial ARG"];
const POSITIONS: Position[] = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

/** Campos de stats agrupados; cada uno es un total de temporada (o per-game, según base elegida). */
const STAT_FIELDS: { key: keyof PlayerStats; label: string; group: string }[] = [
  { key: "gp", label: "Partidos (GP)", group: "Volumen" },
  { key: "min", label: "Minutos", group: "Volumen" },
  { key: "pts", label: "Puntos", group: "Ataque" },
  { key: "fgm", label: "FG convertidos", group: "Ataque" },
  { key: "fga", label: "FG intentados", group: "Ataque" },
  { key: "threePm", label: "Triples conv.", group: "Ataque" },
  { key: "threePa", label: "Triples int.", group: "Ataque" },
  { key: "ftm", label: "Libres conv.", group: "Ataque" },
  { key: "fta", label: "Libres int.", group: "Ataque" },
  { key: "ast", label: "Asistencias", group: "Juego" },
  { key: "oreb", label: "Reb. ofensivo", group: "Juego" },
  { key: "dreb", label: "Reb. defensivo", group: "Juego" },
  { key: "stl", label: "Robos", group: "Juego" },
  { key: "blk", label: "Tapones", group: "Juego" },
  { key: "tov", label: "Pérdidas", group: "Juego" },
  { key: "pf", label: "Faltas", group: "Juego" },
];

const GROUPS = ["Volumen", "Ataque", "Juego"] as const;

type StatErrors = Partial<Record<keyof PlayerStats, string>>;

export function PlayerForm({ existing }: { existing?: Player }) {
  const router = useRouter();
  const [name, setName] = useState(existing?.name ?? "");
  const [team, setTeam] = useState(existing?.team ?? "");
  const [league, setLeague] = useState(existing?.league ?? "LNB");
  const [position, setPosition] = useState<Position>(existing?.position ?? "Base");
  const [season, setSeason] = useState(existing?.season ?? "2025/26");
  const [age, setAge] = useState(existing?.age?.toString() ?? "");
  const [salary, setSalary] = useState(existing?.stats.salary?.toString() ?? "");
  const [sourceUrl, setSourceUrl] = useState(existing?.sourceUrl ?? "");

  const [stats, setStats] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of STAT_FIELDS) {
      const v = existing?.stats[f.key];
      init[f.key] = typeof v === "number" ? String(v) : "";
    }
    return init;
  });

  const [errors, setErrors] = useState<StatErrors>({});
  const [nameError, setNameError] = useState<string | null>(null);

  // Temporadas anteriores (opcional) → alimentan el gráfico de evolución.
  interface PastSeason {
    key: string;
    season: string;
    stats: Record<string, string>;
  }
  const [past, setPast] = useState<PastSeason[]>(() =>
    (existing?.history ?? [])
      .filter((h) => h.season !== existing?.season)
      .map((h, i) => {
        const s: Record<string, string> = {};
        for (const f of STAT_FIELDS) {
          const v = h.stats[f.key];
          s[f.key] = typeof v === "number" ? String(v) : "";
        }
        return { key: `h${i}`, season: h.season, stats: s };
      }),
  );

  function setStat(key: string, value: string) {
    setStats((s) => ({ ...s, [key]: value }));
  }

  /** Prellena el formulario con lo detectado del PDF. No pisa lo que ya escribiste. */
  function applyDetection(d: PdfDetection) {
    if (d.name) setName((cur) => cur || d.name!);
    if (d.team) setTeam((cur) => cur || d.team!);
    if (d.league && LEAGUES.includes(d.league)) setLeague((cur) => (cur === "LNB" ? d.league! : cur));
    if (d.season) setSeason((cur) => (cur === "2025/26" ? d.season! : cur));
    if (d.age) setAge((cur) => cur || String(d.age));
    setStats((cur) => {
      const next = { ...cur };
      for (const f of STAT_FIELDS) {
        const v = d.stats[f.key];
        if (typeof v === "number" && (next[f.key] ?? "") === "") next[f.key] = String(v);
      }
      return next;
    });
  }

  function addPast() {
    const blank: Record<string, string> = {};
    for (const f of STAT_FIELDS) blank[f.key] = "";
    setPast((p) => [...p, { key: `p${Date.now()}`, season: "", stats: blank }]);
  }
  function setPastField(key: string, statKey: string, value: string) {
    setPast((p) => p.map((s) => (s.key === key ? { ...s, stats: { ...s.stats, [statKey]: value } } : s)));
  }
  function setPastSeason(key: string, value: string) {
    setPast((p) => p.map((s) => (s.key === key ? { ...s, season: value } : s)));
  }
  function removePast(key: string) {
    setPast((p) => p.filter((s) => s.key !== key));
  }

  /** Convierte un mapa de strings a PlayerStats (faltantes = 0). No valida (es histórico best-effort). */
  function toStats(map: Record<string, string>): PlayerStats {
    const out = {} as PlayerStats;
    for (const f of STAT_FIELDS) {
      const n = Number((map[f.key] ?? "").trim());
      (out[f.key] as number) = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    return out;
  }

  function validate(): { ok: boolean; parsed?: PlayerStats } {
    const errs: StatErrors = {};
    let nameErr: string | null = null;
    if (!name.trim()) nameErr = "El nombre es obligatorio";

    const parsed = {} as PlayerStats;
    for (const f of STAT_FIELDS) {
      const raw = stats[f.key]?.trim() ?? "";
      const num = raw === "" ? 0 : Number(raw);
      if (raw !== "" && (!Number.isFinite(num) || num < 0)) {
        errs[f.key] = "Debe ser un número ≥ 0";
      }
      (parsed[f.key] as number) = Number.isFinite(num) && num >= 0 ? num : 0;
    }
    // Coherencia básica: convertidos no pueden superar intentados.
    if (parsed.fgm > parsed.fga) errs.fgm = "FG conv. > intentados";
    if (parsed.threePm > parsed.threePa) errs.threePm = "Triples conv. > intentados";
    if (parsed.ftm > parsed.fta) errs.ftm = "Libres conv. > intentados";
    if (parsed.gp <= 0) errs.gp = "GP debe ser > 0";

    setErrors(errs);
    setNameError(nameErr);
    if (nameErr || Object.keys(errs).length > 0) return { ok: false };

    if (salary.trim()) parsed.salary = Math.max(0, Number(salary) || 0);
    return { ok: true, parsed };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { ok, parsed } = validate();
    if (!ok || !parsed) return;

    // Histórico: temporadas pasadas (con season no vacío) + la actual, ordenadas.
    const pastEntries = past
      .filter((p) => p.season.trim())
      .map((p) => ({ season: p.season.trim(), stats: toStats(p.stats) }));
    const currentSeason = season.trim() || "—";
    const history =
      pastEntries.length > 0
        ? [...pastEntries, { season: currentSeason, stats: parsed }]
        : undefined;

    const saved = savePlayer({
      id: existing?.id,
      name: name.trim(),
      team: team.trim() || "—",
      league,
      season: currentSeason,
      position,
      age: age.trim() ? Number(age) : undefined,
      stats: parsed,
      sourceUrl: sourceUrl.trim() || undefined,
      statsBasis: "season",
      confidence: 1, // dato cargado por el usuario → confianza máxima
      history,
    });
    router.push(`/player/${saved.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Autocompletar desde PDF (solo en alta, no en edición) */}
      {!existing && <PdfUpload onDetected={applyDetection} />}

      {/* Identidad */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-heading text-sm uppercase text-ink-muted">Datos del jugador</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} error={nameError ?? undefined} />
          <Input label="Equipo" value={team} onChange={(e) => setTeam(e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-muted">Liga</span>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink focus:border-brand"
            >
              {LEAGUES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-muted">Posición</span>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink focus:border-brand"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <Input label="Temporada" value={season} onChange={(e) => setSeason(e.target.value)} />
          <Input label="Edad" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          <Input label="Salario (USD)" type="number" inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} />
          <Input label="Fuente (URL, opcional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
        </div>
      </Card>

      {/* Stats por grupo */}
      {GROUPS.map((group) => (
        <Card key={group} className="flex flex-col gap-4">
          <h2 className="font-heading text-sm uppercase text-ink-muted">{group}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {STAT_FIELDS.filter((f) => f.group === group).map((f) => (
              <Input
                key={f.key}
                label={f.label}
                type="number"
                inputMode="decimal"
                step="any"
                value={stats[f.key] ?? ""}
                onChange={(e) => setStat(f.key, e.target.value)}
                error={errors[f.key]}
              />
            ))}
          </div>
        </Card>
      ))}

      {/* Histórico (opcional) */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm uppercase text-ink-muted">Temporadas anteriores (opcional)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addPast}>
            + Agregar temporada
          </Button>
        </div>
        <p className="text-xs text-ink-muted">
          Cargá temporadas pasadas para ver la evolución y la proyección de tendencia en el perfil.
        </p>
        {past.length === 0 ? (
          <p className="text-xs text-ink-muted/70">Sin temporadas anteriores cargadas.</p>
        ) : (
          past.map((p) => (
            <div key={p.key} className="rounded-lg border border-line p-3">
              <div className="mb-3 flex items-center gap-3">
                <Input
                  label="Temporada"
                  value={p.season}
                  onChange={(e) => setPastSeason(p.key, e.target.value)}
                  placeholder="2024/25"
                />
                <button
                  type="button"
                  onClick={() => removePast(p.key)}
                  className="mt-5 text-xs text-uv-red hover:underline"
                >
                  Quitar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {STAT_FIELDS.map((f) => (
                  <Input
                    key={f.key}
                    label={f.label.replace(/ \(.*\)/, "")}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={p.stats[f.key] ?? ""}
                    onChange={(e) => setPastField(p.key, f.key, e.target.value)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </Card>

      <p className="text-xs text-ink-muted">
        Cargá totales de la temporada. CourtIQ calcula automáticamente las 8 capas (TS%, eFG%, BPM, Four Factors,
        MBPVI, UV Score) a partir de estos números.
      </p>

      <div className="flex gap-2">
        <Button type="submit" size="lg">
          {existing ? "Guardar cambios" : "Crear jugador"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
