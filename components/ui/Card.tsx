import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Eleva la card con sombra + borde marca al hacer hover. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-line bg-panel/80 p-5 backdrop-blur-sm",
          interactive &&
            "transition-all duration-200 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_12px_40px_-16px_rgba(0,255,135,0.35)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-heading text-lg font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-ink-muted", className)} {...props} />;
}
