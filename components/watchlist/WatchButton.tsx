"use client";

import { useSyncExternalStore } from "react";
import type { Player } from "@/types/player";
import { addWatch, getWatchSnapshot, removeWatch, subscribe } from "@/lib/storage/local";
import { Button } from "@/components/ui/Button";

export function WatchButton({
  player,
  uvScore,
  size = "sm",
}: {
  player: Player;
  uvScore: number;
  size?: "sm" | "md" | "lg";
}) {
  // Reactivo y SSR-safe: lee del store externo, sin setState-in-effect.
  const watched = useSyncExternalStore(
    subscribe,
    () => getWatchSnapshot().some((w) => w.player.id === player.id),
    () => false,
  );

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (watched) removeWatch(player.id);
    else addWatch(player, uvScore);
  }

  return (
    <Button variant={watched ? "primary" : "outline"} size={size} onClick={toggle} aria-pressed={watched}>
      {watched ? "✓ Siguiendo" : "+ Seguir"}
    </Button>
  );
}
