"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getPlayersSnapshot, subscribe, updatePlayers, deletePlayers, type BatchPatch } from "@/lib/storage/local";
import type { Position } from "@/types/player";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const LEAGUES = ["LNB", "Liga Provincial ARG", "NBB", "ACB", "EuroLeague", "NBA", "Liga Uruguaya"];
const POSITIONS: Position[] = ["Base", "Escolta", "Alero", "Ala-Pívot", "Pívot"];

/** Gestión en lote de jugadores cargados: seleccionar varios y editar liga/temporada/equipo/posición o borrar. */
export function BatchManager() {
  const players = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  // Campos del editor en lote (solo se aplican los no vacíos).
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState<string>("");
  const [age, setAge] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? players.filter((p) => p.name.toLowerCase().includes(s) || p.team.toLowerCase().includes(s)) : players;
  }, [players, q]);

  const allShownSelected = filtered.length > 0 && filtered.every((p) => sel.has(p.id));

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    setMsg(null);
  }
  function toggleAllShown() {
    setSel((prev) => {
      const n = new Set(prev);
      if (allShownSelected) filtered.forEach((p) => n.delete(p.id));
      else filtered.forEach((p) => n.add(p.id));
      return n;
    });
  }

  function applyPatch() {
    const patch: BatchPatch = {};
    if (league) patch.league = league;
    if (season.trim()) patch.season = season.trim();
    if (team.trim()) patch.team = team.trim();
    if (position) patch.position = position as Position;
    if (age.trim()) {
      const n = Number(age);
      if (!Number.isFinite(n) || n < 14 || n > 50) {
        setMsg("La edad debe ser un número entre 14 y 50.");
        return;
      }
      patch.age = n;
    }
    if (Object.keys(patch).length === 0) {
      setMsg("Elegí al menos un campo para aplicar.");
      return;
    }
    const n = updatePlayers([...sel], patch);
    setMsg(`${n} jugador${n === 1 ? "" : "es"} actualizado${n === 1 ? "" : "s"}.`);
    setSel(new Set());
    setLeague(""); setSeason(""); setTeam(""); setPosition(""); setAge("");
  }

  function deleteSelected() {
    if (!window.confirm(`¿Borrar ${sel.size} jugador(es)? No se puede deshacer.`)) return;
    const n = deletePlayers([...sel]);
    setMsg(`${n} jugador(es) borrado(s).`);
    setSel(new Set());
  }

  if (players.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center text-sm text-ink-muted">
        <p>No hay jugadores cargados todavía.</p>
        <Link href="/players/new">
          <Button variant="outline" size="sm">Cargar jugadores</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de acción en lote */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm uppercase text-ink-muted">
            Edición en lote · {sel.size} seleccionado{sel.size === 1 ? "" : "s"}
          </h2>
          {msg && <span className="text-xs text-brand">{msg}</span>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <select value={league} onChange={(e) => setLeague(e.target.value)} aria-label="Liga"
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand">
            <option value="">Liga (sin cambio)</option>
            {LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Posición"
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand">
            <option value="">Posición (sin cambio)</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="Temporada"
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand" />
          <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Equipo"
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand" />
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Edad" type="number" inputMode="numeric" aria-label="Edad"
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={applyPatch} disabled={sel.size === 0}>Aplicar a {sel.size}</Button>
          <Button size="sm" variant="ghost" onClick={deleteSelected} disabled={sel.size === 0}>Borrar {sel.size}</Button>
        </div>
      </Card>

      {/* Lista */}
      <div className="flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nombre o equipo…"
          className="h-9 flex-1 rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-brand" />
        <button onClick={toggleAllShown} className="shrink-0 text-xs text-ink-muted underline hover:text-ink">
          {allShownSelected ? "Deseleccionar todos" : `Seleccionar ${filtered.length}`}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-panel/60 text-ink-muted">
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2 text-left font-medium">Jugador</th>
              <th className="px-3 py-2 text-left font-medium">Equipo</th>
              <th className="px-3 py-2 text-left font-medium">Liga</th>
              <th className="px-3 py-2 text-left font-medium">Pos.</th>
              <th className="px-3 py-2 text-left font-medium">Edad</th>
              <th className="px-3 py-2 text-left font-medium">Temp.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-panel/40">
                <td className="px-3 py-2">
                  <input type="checkbox" className="accent-brand" checked={sel.has(p.id)} onChange={() => toggle(p.id)}
                    aria-label={`Seleccionar ${p.name}`} />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/player/${p.id}`} className="text-ink hover:text-brand">{p.name}</Link>
                </td>
                <td className="px-3 py-2 text-ink-muted">{p.team}</td>
                <td className="px-3 py-2 text-ink-muted">{p.league}</td>
                <td className="px-3 py-2 text-ink-muted">{p.position}</td>
                <td className="px-3 py-2 text-ink-muted">{p.age ?? "—"}</td>
                <td className="px-3 py-2 text-ink-muted">{p.season}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
