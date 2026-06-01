"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

/** El atributo data-theme del <html> es la fuente de verdad (lo fija el script anti-FOUC). */
function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

const themeListeners = new Set<() => void>();
function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark" as Theme);

  function toggle() {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("courtiq.theme", next);
    } catch {
      /* modo privado */
    }
    for (const l of themeListeners) l();
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
      className="shrink-0 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
