import { getUVCategory } from "@/lib/moneyball";

export interface UVScoreBadgeProps {
  uvScore: number;
  size?: "sm" | "lg";
}

/** Badge de subvaloración con semáforo (verde/dorado/blanco/rojo). Componente puro. */
export function UVScoreBadge({ uvScore, size = "sm" }: UVScoreBadgeProps) {
  const cat = getUVCategory(uvScore);
  const big = size === "lg";
  // CSS var por tono → se adapta al tema (dark/light). El hex queda solo para el PDF.
  const c = `var(--color-uv-${cat.tone})`;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${big ? "px-4 py-3" : "px-2.5 py-1.5"}`}
      style={{ borderColor: c, backgroundColor: `color-mix(in srgb, ${c} 12%, transparent)` }}
    >
      <span aria-hidden className={big ? "text-xl" : "text-sm"}>
        {cat.emoji}
      </span>
      <span className={`font-numeric ${big ? "text-3xl" : "text-base"}`} style={{ color: c }}>
        {uvScore.toFixed(2)}
      </span>
      <span
        className={`uppercase tracking-wide ${big ? "text-sm" : "text-[10px]"}`}
        style={{ color: c }}
      >
        {cat.label}
      </span>
    </div>
  );
}
