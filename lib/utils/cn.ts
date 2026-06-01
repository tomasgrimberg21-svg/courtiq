/** Une className condicionales filtrando falsy. Alternativa mínima a clsx (sin dependencia). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
