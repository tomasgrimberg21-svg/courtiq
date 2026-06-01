import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Bloque de carga. Usar dimensiones que imiten el layout real para evitar layout shift (CLS).
 * Respeta prefers-reduced-motion (la animación se anula globalmente en globals.css).
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-[var(--animate-shimmer)] rounded-md bg-panel-2/70",
        className,
      )}
      {...props}
    />
  );
}
