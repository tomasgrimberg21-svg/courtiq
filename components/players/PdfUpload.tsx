"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PdfDetection, TableRowDetection } from "@/lib/pdf-extract";
import { fillStats } from "@/lib/pdf-extract";
import { savePlayer } from "@/lib/storage/local";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Sube un PDF, extrae datos heurísticamente (server-side, sin IA) y:
 *  - si es ficha de 1 jugador → prellena el form (onDetected) para revisión;
 *  - si es una tabla de plantel → ofrece importar todas las filas en lote.
 * Nunca guarda sin acción explícita del usuario.
 */
const IMPORT_LEAGUES = ["LNB", "Liga Provincial ARG", "NBB", "ACB", "EuroLeague", "NBA", "Liga Uruguaya"];

export function PdfUpload({ onDetected }: { onDetected: (d: PdfDetection) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [table, setTable] = useState<TableRowDetection[]>([]);
  const [imported, setImported] = useState(0);
  const [league, setLeague] = useState("LNB");
  const [season, setSeason] = useState("2024/25");

  async function handleFile(file: File) {
    setStatus("loading");
    setMessage(null);
    setTable([]);
    setImported(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "No se pudo procesar el PDF.");
        return;
      }
      setStatus("done");
      const rows = (data.table as TableRowDetection[]) ?? [];
      const det = data.detection as PdfDetection;

      // Tabla de varios jugadores tiene prioridad sobre la ficha individual.
      if (rows.length >= 2) {
        setTable(rows);
        setMessage(`Detectamos una tabla con ${rows.length} jugadores. Revisá e importá.`);
        return;
      }

      onDetected(det);
      if (det.detectedCount === 0) {
        setMessage(data.warning ?? "No detectamos estadísticas. Cargá los datos manualmente abajo.");
      } else {
        setMessage(`Detectamos ${det.detectedCount} campo${det.detectedCount === 1 ? "" : "s"}. Revisá y completá lo que falte.`);
      }
    } catch {
      setStatus("error");
      setMessage("Error de red al subir el PDF.");
    }
  }

  function importTable() {
    let n = 0;
    for (const row of table) {
      savePlayer({
        name: row.name,
        team: "—",
        league,
        season: season.trim() || "—",
        position: "Alero",
        stats: fillStats(row.stats),
        statsBasis: "season",
        confidence: 0.85, // datos oficiales de planilla; posición/equipo quedan por completar
      });
      n++;
    }
    setImported(n);
    if (n > 0) setTimeout(() => router.push("/search"), 900);
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm uppercase text-ink-muted">Autocompletar desde PDF (opcional)</h2>
      <p className="text-xs text-ink-muted">
        Subí una ficha en PDF con texto (no escaneada). Si es de un jugador, prellenamos el formulario; si es una
        tabla de plantel, te dejamos importar a todos. <span className="text-ink">Siempre revisá antes de guardar.</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={status === "loading"}>
          {status === "loading" ? "Procesando…" : "Elegir PDF"}
        </Button>
        {message && (
          <span className={`text-xs ${status === "error" ? "text-uv-red" : "text-brand"}`}>{message}</span>
        )}
      </div>

      {table.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="max-h-48 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel">
                <tr className="text-ink-muted">
                  <th className="px-2 py-1 text-left font-medium">Jugador</th>
                  <th className="px-2 py-1 text-right font-medium">GP</th>
                  <th className="px-2 py-1 text-right font-medium">PTS</th>
                  <th className="px-2 py-1 text-right font-medium">Campos</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => (
                  <tr key={i} className="border-t border-line/60">
                    <td className="px-2 py-1 text-ink">{r.name}</td>
                    <td className="px-2 py-1 text-right font-numeric text-ink-muted">{r.stats.gp ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-numeric text-brand">{r.stats.pts ?? "—"}</td>
                    <td className="px-2 py-1 text-right font-numeric text-ink-muted">{Object.keys(r.stats).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-heading uppercase text-ink-muted">Liga</span>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="h-9 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand"
              >
                {IMPORT_LEAGUES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-heading uppercase text-ink-muted">Temporada</span>
              <input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="h-9 w-28 rounded-md border border-line bg-panel px-2 text-sm text-ink focus:border-brand"
              />
            </label>
          </div>
          <p className="text-[11px] text-ink-muted">
            Se importan con la liga y temporada elegidas arriba; la posición queda en &quot;Alero&quot; (editá cada
            jugador después para ajustarla).
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={importTable} disabled={imported > 0}>
              Importar {table.length} jugadores
            </Button>
            {imported > 0 && <span className="text-sm text-brand">✓ {imported} importados — redirigiendo…</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
