"use client";

import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Result =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; detail: string }
  | { kind: "fail"; detail: string };

/**
 * Diagnóstico de la conexión a Supabase: escribe y borra una fila de prueba en `players`
 * y reporta el error EXACTO (en vez del catch silencioso del write-through normal).
 */
export function CloudStatus() {
  const configured = isSupabaseConfigured();
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function test() {
    setResult({ kind: "running" });
    try {
      const sb = supabase();
      const testId = `__diag-${Date.now()}`;
      // 1) Insert de prueba
      const ins = await sb.from("players").upsert({
        id: testId,
        data: { id: testId, name: "Diagnóstico", diag: true },
        updated_at: new Date().toISOString(),
      });
      if (ins.error) {
        setResult({ kind: "fail", detail: `Escritura falló: ${ins.error.message} (code ${ins.error.code ?? "?"})` });
        return;
      }
      // 2) Lectura de prueba
      const sel = await sb.from("players").select("id").eq("id", testId).maybeSingle();
      if (sel.error) {
        setResult({ kind: "fail", detail: `Lectura falló: ${sel.error.message}` });
        return;
      }
      // 3) Limpieza
      await sb.from("players").delete().eq("id", testId);
      setResult({ kind: "ok", detail: "Escritura, lectura y borrado de prueba OK. La sincronización funciona." });
    } catch (e) {
      setResult({ kind: "fail", detail: e instanceof Error ? e.message : "Error desconocido" });
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-sm uppercase text-ink-muted">Estado de la nube (Supabase)</h2>

      <div className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: configured ? "var(--color-uv-green)" : "var(--color-uv-red)" }}
        />
        <span className="text-ink">
          {configured ? "Variables de entorno detectadas" : "Supabase NO configurado en este deploy"}
        </span>
      </div>

      {!configured && (
        <p className="text-xs text-ink-muted">
          La app no ve <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>_ANON_KEY</code>. Cargalas en Vercel
          (Settings → Environment Variables) y hacé un <span className="text-ink">Redeploy</span> — las
          variables solo se aplican en un deploy nuevo.
        </p>
      )}

      {configured && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={test} disabled={result.kind === "running"}>
            {result.kind === "running" ? "Probando…" : "Probar conexión"}
          </Button>
          {result.kind === "ok" && <span className="text-xs text-brand">✓ {result.detail}</span>}
          {result.kind === "fail" && <span className="text-xs text-uv-red">✗ {result.detail}</span>}
        </div>
      )}
    </Card>
  );
}
