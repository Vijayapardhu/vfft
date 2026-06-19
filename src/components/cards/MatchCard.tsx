import { Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { formatMatchTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Match, MatchStatus, Team, WithId } from "@/types";

const STATUS: Record<MatchStatus, { label: string; variant: "blue" | "red" | "green" }> = {
  upcoming: { label: "Upcoming", variant: "blue" },
  live: { label: "● Live", variant: "red" },
  completed: { label: "Completed", variant: "green" },
};

function TeamSide({ team }: { team?: WithId<Team> }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-cream">
        {team?.logoUrl ? (
          <Image src={team.logoUrl} alt={team.name} fill className="object-cover" sizes="56px" />
        ) : (
          <Shield className="h-6 w-6 text-ink/40" />
        )}
      </div>
      <span className="line-clamp-1 text-center text-sm font-bold uppercase">
        {team?.name ?? "TBD"}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  team1,
  team2,
}: {
  match: WithId<Match>;
  team1?: WithId<Team>;
  team2?: WithId<Team>;
}) {
  const status = STATUS[match.status];
  return (
    <Link href={ROUTES.match(match.id)} className="group block">
      <div className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal transition-transform duration-100 group-hover:-translate-y-1 group-hover:shadow-brutal-lg motion-reduce:transition-none">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="cream">Match {match.matchNumber}</Badge>
          <Badge
            variant={status.variant}
            className={cn(match.status === "live" && "animate-pulse motion-reduce:animate-none")}
          >
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <TeamSide team={team1} />
          <span className="text-lg font-bold text-ink/40">VS</span>
          <TeamSide team={team2} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-ink/60">
          <span>{match.map || "Map TBD"}</span>
          <span>{formatMatchTime(match.scheduledAt)}</span>
        </div>
      </div>
    </Link>
  );
}
