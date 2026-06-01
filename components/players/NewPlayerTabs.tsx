"use client";

import { useState } from "react";
import { PlayerForm } from "./PlayerForm";
import { CsvImport } from "./CsvImport";
import { cn } from "@/lib/utils/cn";

type Mode = "single" | "csv";

export function NewPlayerTabs() {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Modo de carga" className="flex gap-1 rounded-lg border border-line bg-panel p-1">
        <Tab active={mode === "single"} onClick={() => setMode("single")}>
          Carga individual
        </Tab>
        <Tab active={mode === "csv"} onClick={() => setMode("csv")}>
          Importar CSV
        </Tab>
      </div>
      {mode === "single" ? <PlayerForm /> : <CsvImport />}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-panel-2 text-brand" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
