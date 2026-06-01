import type { Player } from "@/types/player";

function confidenceMeta(conf: number): { label: string; color: string } {
  if (conf >= 0.75) return { label: "Confianza alta", color: "#00ff87" };
  if (conf >= 0.5) return { label: "Confianza media", color: "#ffd700" };
  return { label: "Confianza baja", color: "#ff4444" };
}

function hostname(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("muestra://")) return "dato de muestra";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-AR");
}

/** Línea de procedencia: fuente + fecha + badge de confianza. El corazón de la confiabilidad. */
export function SourceBadge({ player, compact = false }: { player: Player; compact?: boolean }) {
  const isSample = player.origin === "sample" || player.sourceUrl?.startsWith("muestra://");
  const host = hostname(player.sourceUrl);
  const date = fmtDate(player.lastUpdated);

  if (isSample) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
        Datos de muestra
      </span>
    );
  }

  if (player.origin === "manual") {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-[11px] ${compact ? "" : "text-ink-muted"}`}>
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 uppercase tracking-wide"
          style={{ borderColor: "#00ff8766", color: "#00ff87" }}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
          Carga manual
        </span>
        {host && <span className="text-ink-muted">Fuente: {host}</span>}
        {date && <span className="text-ink-muted">· {date}</span>}
      </div>
    );
  }

  const conf = player.confidence ?? 0;
  const meta = confidenceMeta(conf);

  return (
    <div className={`flex flex-wrap items-center gap-2 text-[11px] ${compact ? "" : "text-ink-muted"}`}>
      <span
        className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 uppercase tracking-wide"
        style={{ borderColor: `${meta.color}66`, color: meta.color }}
        title={`Confianza del dato: ${(conf * 100).toFixed(0)}%`}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
        {meta.label} ({(conf * 100).toFixed(0)}%)
      </span>
      {host &&
        (player.sourceUrl && /^https?:/.test(player.sourceUrl) ? (
          <a
            href={player.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted underline decoration-line underline-offset-2 hover:text-ink"
          >
            Fuente: {host}
          </a>
        ) : (
          <span className="text-ink-muted">Fuente: {host}</span>
        ))}
      {date && <span className="text-ink-muted">· {date}</span>}
    </div>
  );
}
