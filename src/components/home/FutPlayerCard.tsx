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
  { label: string; accent: string; chip: string; sheen: boolean }
> = {
  gold: { label: "Gold", accent: "from-gold/40 to-transparent", chip: "bg-gold/90 text-ink", sheen: false },
  elite: { label: "Elite", accent: "from-indigo/30 to-transparent", chip: "bg-indigo text-white", sheen: true },
  legend: { label: "Legend", accent: "from-gold/60 via-white/40 to-transparent", chip: "bg-ink text-gold", sheen: true },
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

/** Premium FIFA-Ultimate-Team-style card backed by real season stats. */
export function FutPlayerCard({ playerId, size = "md" }: { playerId: string; size?: "md" | "lg" }) {
  const { data: player } = usePlayer(playerId);
  const { data: stats } = usePlayerSeasonStats(playerId);
  if (!player) return null;

  const rating = ratingFor(stats);
  const rarity = rarityFor(rating);
  const r = RARITY[rarity];
  const w = size === "lg" ? "w-64 sm:w-72" : "w-44 sm:w-52";

  return (
    <Link href={ROUTES.player(playerId)} className="group block shrink-0">
      <TiltCard className={w} max={12}>
        <div className="card-premium relative overflow-hidden rounded-[1.75rem]">
          {/* rarity wash */}
          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b opacity-70", r.accent)} />
          {/* subtle sheen sweep on hover */}
          {r.sheen && (
            <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent blur-md transition-transform duration-[1100ms] ease-out group-hover:translate-x-[420%]" />
          )}

          <div className="relative">
            <div className="flex items-start justify-between p-4 pb-0">
              <div className="leading-none">
                <div className={cn("font-light tracking-tight", size === "lg" ? "text-5xl" : "text-4xl")}>{rating}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/50">{player.role}</div>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", r.chip)}>
                {r.label}
              </span>
            </div>

            <div className={cn("relative mx-auto mt-2 aspect-square overflow-hidden rounded-2xl bg-ink/5", size === "lg" ? "w-40" : "w-28 sm:w-32")}>
              {player.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.photoURL} alt={player.ign} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <UserRound className="h-10 w-10 text-ink/25" />
                </div>
              )}
            </div>

            <div className="px-4 pt-3 text-center">
              <p className={cn("truncate font-semibold uppercase tracking-wide", size === "lg" ? "text-xl" : "text-base")}>
                {player.ign}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1 border-t border-ink/10 px-4 py-3 text-center">
              <Stat label="Kills" value={stats?.kills ?? 0} />
              <Stat label="HS" value={stats?.headshots ?? 0} />
              <Stat label="MVP" value={stats?.mvpAwards ?? 0} />
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wider text-ink/45">{label}</div>
    </div>
  );
}
