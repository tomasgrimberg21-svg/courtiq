"use client";

import { useState } from "react";
import { CompareExperience } from "./CompareExperience";
import { TeamCompare } from "./TeamCompare";
import { cn } from "@/lib/utils/cn";

type Mode = "players" | "teams";

export function CompareTabs() {
  const [mode, setMode] = useState<Mode>("players");
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Modo de comparación" className="flex gap-1 rounded-lg border border-line bg-panel p-1">
        <Tab active={mode === "players"} onClick={() => setMode("players")}>
          Jugadores
        </Tab>
        <Tab active={mode === "teams"} onClick={() => setMode("teams")}>
          Quintetos
        </Tab>
      </div>
      {mode === "players" ? <CompareExperience /> : <TeamCompare />}
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
