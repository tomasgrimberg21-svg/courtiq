import { Skeleton } from "@/components/ui/Skeleton";

/** Estado de carga a nivel de ruta. Skeletons que imitan el layout para evitar layout shift. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </main>
  );
}
