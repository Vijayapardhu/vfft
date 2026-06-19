"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Crown, Flame, Shield, Star, Trophy, UserRound, Zap } from "lucide-react";
import { useHallOfFame } from "@/hooks/useHallOfFame";
import { useTeam } from "@/hooks/useTeams";
import { usePlayer } from "@/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { HallOfFameEntry, WithId } from "@/types";

/* ── Sub-components ──────────────────────────────────────────────────────── */

function HeroLabel({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function ChampionCard({ teamId }: { teamId: string | null }) {
  const { data: team } = useTeam(teamId);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-4 border-vyellow bg-cream p-5 shadow-brutal-md">
      <Crown className="h-6 w-6 text-vyellow" />
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/20">
        {team?.logoUrl ? (
          <Image src={team.logoUrl} alt={team.name ?? ""} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="grid h-full place-items-center">
            <Shield className="h-8 w-8 text-ink/30" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Champion</p>
        <p className="text-base font-bold">{team?.name ?? "—"}</p>
      </div>
    </div>
  );
}

function MvpCard({ playerId }: { playerId: string | null }) {
  const { data: player } = usePlayer(playerId);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-4 border-vpurple bg-cream p-5 shadow-brutal-md">
      <Star className="h-6 w-6 text-vpurple" />
      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/20">
        {player?.photoURL ? (
          <Image src={player.photoURL} alt={player.ign} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="grid h-full place-items-center">
            <UserRound className="h-8 w-8 text-ink/30" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Season MVP</p>
        <p className="text-base font-bold">{player?.ign ?? "—"}</p>
      </div>
    </div>
  );
}

function SeasonChapter({
  entry,
  index,
}: {
  entry: WithId<HallOfFameEntry>;
  index: number;
}) {
  const { data: killKing } = usePlayer(entry.highestKillsPlayerId);
  const { data: bestTeam } = useTeam(entry.bestTeamId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="overflow-hidden rounded-3xl border-4 border-ink"
    >
      {/* Season banner — ink bg */}
      <div className="relative overflow-hidden bg-ink px-6 py-8">
        <div className="absolute inset-0 bg-dots opacity-5" />
        {/* Season number watermark */}
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-[120px] font-bold leading-none text-white/[0.04]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-vyellow">
            Season {index + 1}
          </p>
          <h2 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {entry.seasonName}
          </h2>
          <div className="mt-5 flex flex-wrap gap-4">
            <HeroLabel
              icon={<Trophy className="h-4 w-4 text-vyellow" />}
              label="Champion"
              value="see below"
            />
            <HeroLabel
              icon={<Zap className="h-4 w-4 text-vred" />}
              label="Kill King"
              value={killKing ? `${killKing.ign} · ${entry.highestKills ?? "?"} kills` : "—"}
            />
            <HeroLabel
              icon={<Flame className="h-4 w-4 text-vpurple" />}
              label="Best Team"
              value={bestTeam?.name ?? "—"}
            />
          </div>
        </div>
      </div>

      {/* Cards row — cream bg */}
      <div className="grid grid-cols-2 gap-5 bg-cream p-5 sm:grid-cols-2">
        <ChampionCard teamId={entry.championTeamId} />
        <MvpCard playerId={entry.mvpPlayerId} />
      </div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function HallOfFamePage() {
  const { data: entries, loading, error } = useHallOfFame();

  return (
    <div className="min-h-dvh bg-cream">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-ink px-5 py-20 text-center">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-vyellow bg-vyellow/10">
            <Crown className="h-10 w-10 text-vyellow" />
          </div>
          <h1 className="text-5xl font-bold text-white sm:text-6xl">Hall of Fame</h1>
          <p className="mt-3 text-base font-medium text-white/50">
            Every champion. Every legend. Every season.
          </p>
        </motion.div>
      </div>

      {/* ── Timeline ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border-4 border-ink">
                <div className="bg-ink p-6">
                  <Skeleton className="mb-2 h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-56 bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4 bg-cream p-5">
                  <Skeleton className="h-48 rounded-2xl border-4 border-ink" />
                  <Skeleton className="h-48 rounded-2xl border-4 border-ink" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load hall of fame." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="No entries yet"
            message="Hall of Fame entries are recorded when seasons conclude."
          />
        ) : (
          /* Chronological — oldest first (asc index = Season 1 first) */
          [...entries]
            .reverse()
            .map((entry, i) => (
              <SeasonChapter key={entry.id} entry={entry} index={entries.length - 1 - i} />
            ))
        )}
      </div>
    </div>
  );
}
