"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/search", label: "Jugadores" },
  { href: "/players/new", label: "Cargar" },
  { href: "/compare", label: "Comparar" },
  { href: "/roster-builder", label: "Roster" },
  { href: "/watchlist", label: "Seguimiento" },
  { href: "/settings", label: "Calibración" },
  { href: "/glosario", label: "Glosario" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Principal">
        <Link href="/" className="shrink-0 font-heading text-lg font-bold tracking-wide text-ink">
          Court<span className="text-brand">IQ</span>
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-xs transition-colors sm:px-3 sm:text-sm",
                  active ? "bg-panel-2 text-brand" : "text-ink-muted hover:bg-panel-2 hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
