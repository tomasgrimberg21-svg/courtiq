"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Copia al portapapeles una URL construida on-demand (estado compartible sin backend). */
export function ShareButton({ getUrl, label = "Compartir" }: { getUrl: () => string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* portapapeles no disponible */
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {copied ? "¡Link copiado!" : label}
    </Button>
  );
}
