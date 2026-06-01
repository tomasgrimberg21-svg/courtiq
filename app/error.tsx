"use client"; // Los error boundaries deben ser Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // En producción acá iría el reporte a un servicio de observabilidad.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="font-numeric text-sm text-uv-red">ERROR</span>
      <h1 className="mt-2 font-heading text-3xl text-ink">Algo salió mal</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Ocurrió un error inesperado al renderizar esta sección. Podés reintentar.
      </p>
      <div className="mt-6">
        <Button onClick={() => unstable_retry()}>Reintentar</Button>
      </div>
    </main>
  );
}
