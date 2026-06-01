"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePlayersCsv, CSV_TEMPLATE, type ParseResult } from "@/lib/csv-import";
import { savePlayer } from "@/lib/storage/local";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CsvImport() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [imported, setImported] = useState(0);

  function preview() {
    setImported(0);
    setResult(parsePlayersCsv(text));
  }

  function doImport() {
    if (!result) return;
    let n = 0;
    for (const row of result.ok) {
      if (row.player) {
        savePlayer(row.player);
        n++;
      }
    }
    setImported(n);
    if (n > 0) {
      // Pequeña pausa visual y vamos a la lista.
      setTimeout(() => router.push("/search"), 700);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="font-heading text-sm uppercase text-ink-muted">Pegá tu CSV o TSV</h2>
        <p className="text-xs text-ink-muted">
          Primera fila = encabezados. Acepta coma o tab, decimales con coma, y alias en español/inglés
          (nombre/name, gp/pj/partidos, pts/puntos, 3pm/triplesc, etc.). Si traés <code>reb</code> total, lo
          repartimos en ofensivo/defensivo.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={CSV_TEMPLATE}
          aria-label="Datos CSV"
          className="w-full rounded-lg border border-line bg-panel p-3 font-mono text-xs text-ink placeholder:text-ink-muted/50 focus:border-brand"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={preview} disabled={!text.trim()}>
            Previsualizar
          </Button>
          <Button variant="outline" onClick={() => setText(CSV_TEMPLATE)}>
            Cargar ejemplo
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-heading text-sm uppercase text-ink-muted">Previsualización</span>
            <span className="font-numeric text-sm text-brand">{result.ok.length} válidas</span>
            {result.failed.length > 0 && (
              <span className="font-numeric text-sm text-uv-red">{result.failed.length} con error</span>
            )}
          </div>

          {result.ok.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-muted">
                    <th className="py-1 text-left font-medium">Nombre</th>
                    <th className="py-1 text-left font-medium">Equipo</th>
                    <th className="py-1 text-left font-medium">Liga</th>
                    <th className="py-1 text-right font-medium">PTS</th>
                    <th className="py-1 text-right font-medium">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ok.slice(0, 50).map((r) => (
                    <tr key={r.line} className="border-t border-line">
                      <td className="py-1 text-ink">{r.player!.name}</td>
                      <td className="py-1 text-ink-muted">{r.player!.team}</td>
                      <td className="py-1 text-ink-muted">{r.player!.league}</td>
                      <td className="py-1 text-right font-numeric text-brand">{r.player!.stats.pts}</td>
                      <td className="py-1 text-right font-numeric text-ink-muted">{r.player!.stats.gp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.failed.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-uv-red">
              {result.failed.map((r) => (
                <li key={r.line}>
                  Línea {r.line}: {r.error}
                </li>
              ))}
            </ul>
          )}

          {result.ok.length > 0 && (
            <div className="flex items-center gap-3">
              <Button onClick={doImport} disabled={imported > 0}>
                Importar {result.ok.length} jugador{result.ok.length === 1 ? "" : "es"}
              </Button>
              {imported > 0 && <span className="text-sm text-brand">✓ {imported} importados — redirigiendo…</span>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
