"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { TiltCard } from "@/components/fx/TiltCard";
import { ROUTES } from "@/constants/routes";
import { usePlayer, usePlayerSeasonStats } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";

type Rarity = "gold" | "elite" | "legend";

const RARITY: Record<
  Rarity,
  { label: string; wash: string; chip: string }
> = {
  gold: { label: "Gold", wash: "bg-vyellow", chip: "bg-vyellow text-ink" },
  elite: { label: "Elite", wash: "bg-vpurple", chip: "bg-vpurple text-ink" },
  legend: { label: "Legend", wash: "bg-vred", chip: "bg-ink text-vyellow" },
};

function ratingFor(s: {
  kills?: number;
  headshots?: number;
  mvpAwards?: number;
  matchesPlayed?: number;
} | null): number {
  if (!s) return 64;
  const raw =
    58 +
    (s.kills ?? 0) * 1.0 +
    (s.headshots ?? 0) * 0.6 +
    (s.mvpAwards ?? 0) * 6 +
    (s.matchesPlayed ?? 0) * 0.5;
  return Math.max(58, Math.min(99, Math.round(raw)));
}

const rarityFor = (r: number): Rarity => (r >= 85 ? "legend" : r >= 72 ? "elite" : "gold");

/** FIFA-Ultimate-Team-style card in the neo-brutalist game theme. */
export function FutPlayerCard({ playerId, size = "md" }: { playerId: string; size?: "md" | "lg" }) {
  const { data: player } = usePlayer(playerId);
  const { data: stats } = usePlayerSeasonStats(playerId);
  if (!player) return null;

  const rating = ratingFor(stats);
  const rarity = rarityFor(rating);
  const r = RARITY[rarity];
  const w = size === "lg" ? "w-60 sm:w-72" : "w-44 sm:w-52";

  return (
    <Link href={ROUTES.player(playerId)} className="group block shrink-0">
      <TiltCard className={w} max={12}>
        <div className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-md">
          {/* rarity header */}
          <div className={cn("relative flex items-start justify-between border-b-4 border-ink p-4", r.wash)}>
            <div className="leading-none">
              <div className={cn("font-bold", size === "lg" ? "text-5xl" : "text-4xl")}>{rating}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink/70">{player.role}</div>
            </div>
            <span className={cn("rounded-lg border-2 border-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", r.chip)}>
              {r.label}
            </span>
          </div>

          {/* portrait */}
          <div className={cn("relative mx-auto mt-4 aspect-square overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/30", size === "lg" ? "w-40" : "w-28 sm:w-32")}>
            {player.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoURL} alt={player.ign} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <UserRound className="h-10 w-10 text-ink/30" />
              </div>
            )}
          </div>

          <div className="px-4 pt-3 text-center">
            <p className={cn("truncate font-bold uppercase tracking-tight", size === "lg" ? "text-xl" : "text-base")}>
              {player.ign}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 border-t-4 border-ink px-3 py-3 text-center">
            <Stat label="Kills" value={stats?.kills ?? 0} />
            <Stat label="HS" value={stats?.headshots ?? 0} />
            <Stat label="MVP" value={stats?.mvpAwards ?? 0} />
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-ink/50">{label}</div>
    </div>
  );
}
