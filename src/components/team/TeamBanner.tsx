import { Shield } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Team, WithId } from "@/types";

/** Hero banner for a franchise (UID §9 dashboard / §10 team page). */
export function TeamBanner({
  team,
  rank,
}: {
  team: WithId<Team>;
  rank?: number;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
      <div
        className="relative flex items-center gap-4 bg-vpurple p-5"
        style={team.primaryColor ? { backgroundColor: team.primaryColor } : undefined}
      >
        {team.bannerUrl && (
          <Image
            src={team.bannerUrl}
            alt=""
            fill
            className="object-cover opacity-30"
            sizes="100vw"
          />
        )}
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-xs">
          {team.logoUrl ? (
            <Image
              src={team.logoUrl}
              alt={team.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <Shield className="h-9 w-9 text-ink/40" />
          )}
        </div>
        <div className="relative min-w-0">
          {typeof rank === "number" && (
            <Badge variant="yellow" className="mb-1">
              Rank #{rank}
            </Badge>
          )}
          <h2 className="truncate text-3xl text-ink">{team.name}</h2>
        </div>
      </div>
    </div>
  );
}
