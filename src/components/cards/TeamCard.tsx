import { Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import type { Team, WithId } from "@/types";

/** Franchise tile for the teams grid (UID §8 / §23). */
export function TeamCard({ team }: { team: WithId<Team> }) {
  return (
    <Link href={ROUTES.team(team.id)} className="group block">
      <div className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal transition-transform duration-100 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-brutal-lg motion-reduce:transition-none">
        <div
          className="relative h-24 border-b-4 border-ink bg-vpurple"
          style={team.primaryColor ? { backgroundColor: team.primaryColor } : undefined}
        >
          {team.bannerUrl && (
            <Image
              src={team.bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          )}
        </div>
        <div className="flex items-center gap-3 p-4">
          <div className="relative -mt-12 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-xs">
            {team.logoUrl ? (
              <Image
                src={team.logoUrl}
                alt={team.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <Shield className="h-7 w-7 text-ink/40" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold uppercase">{team.name}</div>
            <div className="text-xs font-medium text-ink/50">
              {team.squad?.length ?? 0}/{MAX_SQUAD_SIZE} players
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal">
      <Skeleton className="h-24 rounded-none border-0" />
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="-mt-12 h-16 w-16 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3 border-0" />
          <Skeleton className="h-3 w-1/3 border-0" />
        </div>
      </div>
    </div>
  );
}
