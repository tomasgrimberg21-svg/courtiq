"use client";

import { useSyncExternalStore } from "react";
import { getPlayersSnapshot, subscribe, clearAllData } from "@/lib/storage/local";
import { playersToCsv } from "@/lib/csv-export";
import { Button } from "@/components/ui/Button";

/** Acciones de datos: exportar a CSV los jugadores cargados + borrar todo lo local. */
export function DataActions() {
  const players = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const count = players.length;

  function exportCsv() {
    const csv = playersToCsv(players);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `courtiq-jugadores-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (window.confirm("¿Borrar TODOS los datos locales (jugadores, rosters y seguimiento)? No se puede deshacer.")) {
      clearAllData();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportCsv} disabled={count === 0}>
        Exportar CSV {count > 0 ? `(${count})` : ""}
      </Button>
      <Button variant="ghost" size="sm" onClick={clearAll}>
        Borrar datos locales
      </Button>
    </div>
  );
}
