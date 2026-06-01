"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const STORAGE_KEY = "courtiq.access";
const ACCESS_KEY = "46190963";

/**
 * Gate de acceso por clave.
 *
 * NOTA DE SEGURIDAD: esto es un gate ligero del lado del cliente. La clave viaja en el bundle
 * y NO es seguridad real (cualquiera puede inspeccionarla). Sirve para evitar el acceso casual.
 * Para seguridad real haría falta autenticación del lado servidor (Supabase Auth, pendiente).
 */

const listeners = new Set<() => void>();
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === ACCESS_KEY;
}
function grant() {
  try {
    window.localStorage.setItem(STORAGE_KEY, ACCESS_KEY);
  } catch {
    /* modo privado */
  }
  for (const l of listeners) l();
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const authed = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (authed) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() === ACCESS_KEY) {
      grant();
      setError(null);
    } else {
      setError("Clave incorrecta.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-ink">
          Court<span className="text-brand">IQ</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Acceso restringido</p>
      </div>
      <Card className="w-full">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Clave de acceso"
            type="password"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            placeholder="••••••••"
          />
          <Button type="submit" size="lg">
            Ingresar
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-[10px] text-ink-muted/60">
        Gate de acceso del lado del cliente. No protege datos sensibles.
      </p>
    </main>
  );
}
