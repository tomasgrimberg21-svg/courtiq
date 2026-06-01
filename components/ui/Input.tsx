import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Texto de error; activa estado y `aria-invalid`. */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "h-10 rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-ink-muted/60",
            "transition-colors focus:border-brand",
            error && "border-uv-red",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-uv-red">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
