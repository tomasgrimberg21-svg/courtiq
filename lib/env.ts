/**
 * Validación de variables de entorno con Zod.
 *
 * La validación es LAZY (se ejecuta la primera vez que un route handler la invoca), no al
 * importar el módulo: validar al top-level rompería `next build` y `next dev` cuando todavía
 * no existe `.env.local`. El error se lanza recién cuando un endpoint realmente necesita la key.
 */
import { z } from "zod";

const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY es requerida (solo server-side)"),
  // Modelo runtime. Default Sonnet 4.6 por costo (endpoint de búsqueda de alto volumen).
  // Cambiable a claude-opus-4-8 para máxima calidad. NO usar strings con sufijo de fecha.
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
let cached: ServerEnv | null = null;

/** Devuelve el entorno server validado. Lanza error claro si falta config. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuración de entorno inválida → ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Variables públicas (NEXT_PUBLIC_*), seguras para el cliente. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
