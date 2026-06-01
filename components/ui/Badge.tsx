import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "brand" | "gold" | "white" | "red";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "border-line text-ink-muted",
  brand: "border-uv-green/40 text-uv-green",
  gold: "border-uv-gold/40 text-uv-gold",
  white: "border-uv-white/40 text-uv-white",
  red: "border-uv-red/40 text-uv-red",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
