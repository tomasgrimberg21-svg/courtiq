"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getPlayersSnapshot, subscribe } from "@/lib/storage/local";
import { PlayerForm } from "./PlayerForm";
import { Card } from "@/components/ui/Card";

export function EditPlayerClient({ id }: { id: string }) {
  const players = useSyncExternalStore(subscribe, getPlayersSnapshot, getPlayersSnapshot);
  const player = players.find((p) => p.id === id);

  if (!player) {
    return (
      <Card className="text-center text-sm text-ink-muted">
        No se encontró un jugador cargado con ese id.{" "}
        <Link href="/players/new" className="text-brand hover:underline">
          Cargar uno nuevo
        </Link>
        .
      </Card>
    );
  }

  return <PlayerForm existing={player} />;
}
