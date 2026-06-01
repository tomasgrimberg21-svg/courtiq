import Link from "next/link";
import type { Player } from "@/types/player";
import type { LayerResults } from "@/types/metrics";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ValueBadge } from "@/components/analytics/ValueBadge";
import { SourceBadge } from "@/components/analytics/SourceBadge";

export function PlayerResultCard({ player, layers }: { player: Player; layers: LayerResults }) {
  return (
    <Link href={`/player/${player.id}`} className="block rounded-xl">
      <Card interactive className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg text-ink">{player.name}</h3>
            <p className="text-sm text-ink-muted">
              {player.team} · {player.position}
            </p>
          </div>
          <Badge tone="neutral">{player.league}</Badge>
        </div>

        <ValueBadge uvScore={layers.uvScore} mbpvi={layers.mbpvi} />

        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
          {[
            ["eFG%", `${(layers.efg * 100).toFixed(1)}`],
            ["BPM", layers.bpm.toFixed(1)],
            ["TPI", layers.tpi.toFixed(0)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase text-ink-muted">{k}</dt>
              <dd className="font-numeric text-base text-brand">{v}</dd>
            </div>
          ))}
        </dl>

        <SourceBadge player={player} compact />
      </Card>
    </Link>
  );
}
