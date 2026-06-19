"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { TiltCard } from "@/components/fx/TiltCard";
import { ROUTES } from "@/constants/routes";
import { usePlayer, usePlayerSeasonStats } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";

type Rarity = "bronze" | "silver" | "gold" | "elite" | "legendary" | "mythic";

interface RarityConfig {
  label: string;
  /** Header background class */
  wash: string;
  /** Rarity badge classes */
  chip: string;
  /** Photo border class */
  photoBorder: string;
  /** Extra wrapper class for glow */
  wrapClass?: string;
  holo: boolean;
}

const RARITY: Record<Rarity, RarityConfig> = {
  bronze: {
    label: "Bronze",
    wash: "bg-amber-800",
    chip: "bg-amber-700 text-cream",
    photoBorder: "border-amber-700",
    holo: false,
  },
  silver: {
    label: "Silver",
    wash: "bg-slate-400",
    chip: "bg-slate-500 text-cream",
    photoBorder: "border-slate-400",
    holo: false,
  },
  gold: {
    label: "Gold",
    wash: "bg-vyellow",
    chip: "bg-vyellow text-ink",
    photoBorder: "border-ink",
    holo: false,
  },
  elite: {
    label: "Elite",
    wash: "bg-vpurple",
    chip: "bg-vpurple text-ink",
    photoBorder: "border-vpurple",
    holo: false,
  },
  legendary: {
    label: "Legendary",
    wash: "bg-vred",
    chip: "bg-vred text-cream",
    photoBorder: "border-vred",
    wrapClass: "legendary-glow",
    holo: false,
  },
  mythic: {
    label: "Mythic",
    wash: "bg-ink",
    chip: "bg-vpurple text-cream",
    photoBorder: "border-vpurple",
    wrapClass: "mythic-glow",
    holo: true,
  },
};

function ratingFor(s: {
  kills?: number;
  headshots?: number;
  mvpAwards?: number;
  matchesPlayed?: number;
} | null): number {
  if (!s) return 62;
  const raw =
    58 +
    (s.kills ?? 0) * 1.0 +
    (s.headshots ?? 0) * 0.6 +
    (s.mvpAwards ?? 0) * 6 +
    (s.matchesPlayed ?? 0) * 0.5;
  return Math.max(58, Math.min(99, Math.round(raw)));
}

function rarityFor(r: number): Rarity {
  if (r >= 92) return "mythic";
  if (r >= 85) return "legendary";
  if (r >= 78) return "elite";
  if (r >= 71) return "gold";
  if (r >= 65) return "silver";
  return "bronze";
}

/** FIFA-Ultimate-Team-style card — 6 rarity tiers with holographic FX. */
export function FutPlayerCard({
  playerId,
  size = "md",
}: {
  playerId: string;
  size?: "md" | "lg";
}) {
  const { data: player } = usePlayer(playerId);
  const { data: stats } = usePlayerSeasonStats(playerId);
  if (!player) return null;

  const rating = ratingFor(stats);
  const rarity = rarityFor(rating);
  const cfg = RARITY[rarity];
  const w = size === "lg" ? "w-60 sm:w-72" : "w-44 sm:w-52";
  const photoSize = size === "lg" ? "w-40" : "w-28 sm:w-32";

  return (
    <Link href={ROUTES.player(playerId)} className="group block shrink-0">
      <TiltCard className={w} max={10}>
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-md",
            cfg.wrapClass,
          )}
        >
          {/* Holographic overlay — Mythic only */}
          {cfg.holo && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 rounded-3xl holo-shimmer opacity-40"
            />
          )}

          {/* Rarity header */}
          <div
            className={cn(
              "relative flex items-start justify-between border-b-4 border-ink p-4",
              cfg.wash,
            )}
          >
            <div className="leading-none">
              <div
                className={cn(
                  "font-bold",
                  size === "lg" ? "text-5xl" : "text-4xl",
                  rarity === "mythic" ? "text-vpurple" : "",
                )}
              >
                {rating}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                {player.role}
              </div>
            </div>
            <span
              className={cn(
                "rounded-lg border-2 border-white/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                cfg.chip,
              )}
            >
              {cfg.label}
            </span>
          </div>

          {/* Portrait */}
          <div
            className={cn(
              "relative mx-auto mt-4 aspect-square overflow-hidden rounded-2xl border-4 bg-vpurple/20",
              cfg.photoBorder,
              photoSize,
            )}
          >
            {player.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoURL}
                alt={player.ign}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <UserRound className="h-10 w-10 text-ink/30" />
              </div>
            )}
          </div>

          {/* IGN */}
          <div className="px-4 pt-3 text-center">
            <p
              className={cn(
                "truncate font-bold uppercase tracking-tight",
                size === "lg" ? "text-xl" : "text-base",
              )}
            >
              {player.ign}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-3 grid grid-cols-3 gap-1 border-t-4 border-ink px-3 py-3 text-center">
            <StatCell label="Kills" value={stats?.kills ?? 0} />
            <StatCell label="HS" value={stats?.headshots ?? 0} />
            <StatCell label="MVP" value={stats?.mvpAwards ?? 0} />
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-ink/50">{label}</div>
    </div>
  );
}
