import { getSamplePlayer } from "@/lib/sample-data";
import { PlayerProfile } from "@/components/players/PlayerProfile";

// Soporta jugadores de muestra (server) y cargados manualmente (localStorage, resueltos en cliente).
export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const samplePlayer = getSamplePlayer(id) ?? null;
  return <PlayerProfile id={id} samplePlayer={samplePlayer} />;
}
