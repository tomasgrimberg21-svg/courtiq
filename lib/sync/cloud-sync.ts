/**
 * Sincronización de bajada con la base compartida (Supabase).
 *
 * Modelo: localStorage es el caché reactivo que la UI lee; Supabase es la fuente compartida.
 * Al montar la app (cliente), bajamos jugadores y rosters y reemplazamos el caché local.
 * Las escrituras (savePlayer/saveRoster) ya hacen write-through en `lib/storage/local.ts`.
 *
 * Best-effort: si Supabase no está configurado o falla, la app sigue funcionando solo-local.
 */
import type { Player } from "@/types/player";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { replacePlayersLocal, replaceRostersLocal, type SavedRoster } from "@/lib/storage/local";

let pulled = false;

/** Baja jugadores + rosters de Supabase y reemplaza el caché local. Idempotente por sesión. */
export async function pullFromCloud(): Promise<{ players: number; rosters: number } | null> {
  if (!isSupabaseConfigured() || pulled) return null;
  pulled = true;
  try {
    const sb = supabase();
    const [{ data: playerRows }, { data: rosterRows }] = await Promise.all([
      sb.from("players").select("data").order("updated_at", { ascending: false }),
      sb.from("rosters").select("id,name,slots,created_at").order("created_at", { ascending: false }),
    ]);

    if (playerRows) {
      const players = playerRows
        .map((r) => (r as { data: Player }).data)
        .filter((p): p is Player => Boolean(p && p.id && p.name));
      replacePlayersLocal(players);
    }
    if (rosterRows) {
      const rosters: SavedRoster[] = rosterRows.map((r) => {
        const row = r as { id: string; name: string; slots: SavedRoster["slots"]; created_at: string };
        return { id: row.id, name: row.name, slots: row.slots, createdAt: row.created_at };
      });
      replaceRostersLocal(rosters);
    }
    return { players: playerRows?.length ?? 0, rosters: rosterRows?.length ?? 0 };
  } catch {
    pulled = false; // permití reintentar en una próxima carga
    return null;
  }
}
