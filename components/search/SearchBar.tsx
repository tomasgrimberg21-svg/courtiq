"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const PLACEHOLDERS = [
  "Filtrá por jugador o equipo…",
  "Ej: base subvalorado en LNB…",
  "Ej: pívot eficiente en NBB…",
  "Ej: tu próximo fichaje…",
];

/** Barra principal: filtra la lista de jugadores (muestra + cargados) navegando a /search. */
export function SearchBar() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const focused = useRef(false);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (!focused.current) setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-panel/80 p-2 backdrop-blur-sm transition-colors focus-within:border-brand">
        <label htmlFor="court-search" className="sr-only">
          Buscar jugador, equipo o liga
        </label>
        <input
          id="court-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (focused.current = true)}
          onBlur={() => (focused.current = false)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          className="h-12 flex-1 rounded-md bg-transparent px-4 text-base text-ink placeholder:text-ink-muted/70"
        />
        <Button type="submit" size="lg" aria-label="Buscar">
          Analizar
        </Button>
      </div>
    </form>
  );
}
