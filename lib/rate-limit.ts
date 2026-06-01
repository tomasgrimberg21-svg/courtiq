/**
 * Rate limiting in-memory (fixed window) por clave/IP.
 *
 * NOTA: es por-instancia (no compartido entre réplicas ni serverless cold starts).
 * Suficiente para dev y single-instance; en producción horizontal usar Upstash/Redis.
 * Por eso los endpoints de IA corren en runtime "nodejs" (no edge), donde el módulo persiste.
 */
interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Extrae la IP del cliente de los headers (best-effort detrás de proxy). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anon";
}
