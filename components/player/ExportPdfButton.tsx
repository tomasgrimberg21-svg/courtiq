"use client";

import { useState } from "react";
import type { Player } from "@/types/player";
import { Button } from "@/components/ui/Button";

export function ExportPdfButton({ player }: { player: Player }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          title: `Informe — ${player.name}`,
          data: {
            name: player.name,
            team: player.team,
            league: player.league,
            season: player.season,
            stats: player.stats,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Error generando PDF" }));
        setError(j.error ?? "Error generando PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${player.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar el PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={onExport} disabled={loading}>
        {loading ? "Generando…" : "Exportar PDF"}
      </Button>
      {error && <span className="text-[10px] text-uv-red">{error}</span>}
    </div>
  );
}
