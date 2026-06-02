import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck público (sin datos sensibles): reporta si Supabase está configurado en el
 * servidor y si las tablas `players`/`rosters` responden. NO expone URL ni keys.
 * Útil para diagnosticar el deploy sin pasar credenciales por chat.
 */
export async function GET(): Promise<Response> {
  if (!isSupabaseConfigured()) {
    return json({ configured: false, message: "Supabase no configurado en el servidor (faltan env vars)." });
  }
  try {
    const sb = supabase();
    const players = await sb.from("players").select("id", { count: "exact", head: true });
    const rosters = await sb.from("rosters").select("id", { count: "exact", head: true });
    return json({
      configured: true,
      players: players.error ? { ok: false, error: players.error.message } : { ok: true, count: players.count ?? 0 },
      rosters: rosters.error ? { ok: false, error: rosters.error.message } : { ok: true, count: rosters.count ?? 0 },
    });
  } catch (e) {
    return json({ configured: true, ok: false, error: e instanceof Error ? e.message : "error" });
  }
}
