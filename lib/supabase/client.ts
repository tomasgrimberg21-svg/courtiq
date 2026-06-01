import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** True si las variables públicas de Supabase están configuradas. */
export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

/** Cliente Supabase (anon). Lanza si falta configuración. Lazy singleton. */
export function supabase(): SupabaseClient {
  if (client) return client;
  const { supabaseUrl, supabaseAnonKey } = publicEnv;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)");
  }
  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
