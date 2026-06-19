import { UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAYER_ROLE_LABELS } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Player, PlayerRole, WithId } from "@/types";

const ROLE_VARIANT: Record<PlayerRole, "red" | "blue" | "green" | "purple"> = {
  rusher: "red",
  sniper: "blue",
  support: "green",
  igl: "purple",
};

/** Trading-card style player tile (UID §23). IGN-forward; realName stays private. */
export function PlayerCard({ player }: { player: WithId<Player> }) {
  return (
    <Link href={ROUTES.player(player.id)} className="group block">
      <div className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal transition-transform duration-100 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-brutal-lg motion-reduce:transition-none">
        <div className="relative aspect-square bg-vpurple/40">
          {player.photoURL ? (
            <Image
              src={player.photoURL}
              alt={player.ign}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 220px"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <UserRound className="h-16 w-16 text-ink/30" />
            </div>
          )}
          <span className="absolute left-2 top-2">
            <Badge variant={ROLE_VARIANT[player.role]}>
              {PLAYER_ROLE_LABELS[player.role]}
            </Badge>
          </span>
        </div>
        <div className="border-t-4 border-ink p-3">
          <div className="truncate text-lg font-bold uppercase">{player.ign}</div>
          {typeof player.soldPrice === "number" ? (
            <div className="text-sm font-bold text-vred">
              {player.soldPrice.toLocaleString()} coins
            </div>
          ) : (
            <div className="text-xs font-medium text-ink/50">
              {player.teamId ? "Signed" : "Auction pool"}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PlayerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal",
        className,
      )}
    >
      <Skeleton className="aspect-square rounded-none border-0" />
      <div className="space-y-2 border-t-4 border-ink p-3">
        <Skeleton className="h-5 w-2/3 border-0" />
        <Skeleton className="h-3 w-1/3 border-0" />
      </div>
    </div>
  );
}
