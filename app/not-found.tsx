import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="font-numeric text-5xl text-brand">404</span>
      <h1 className="mt-2 font-heading text-3xl text-ink">No encontramos esa página</h1>
      <p className="mt-2 text-sm text-ink-muted">
        El jugador o la sección que buscás no existe o todavía no fue ingerido.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/search">
          <Button>Ir a búsqueda</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Inicio</Button>
        </Link>
      </div>
    </main>
  );
}
