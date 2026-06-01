"use client";

import { useEffect } from "react";
import { pullFromCloud } from "@/lib/sync/cloud-sync";

/**
 * Dispara la sincronización de bajada con Supabase una vez al montar (cliente).
 * Sin UI. Si Supabase no está configurado, no hace nada.
 */
export function CloudSync() {
  useEffect(() => {
    void pullFromCloud();
  }, []);
  return null;
}
