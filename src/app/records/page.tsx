"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Coins,
  Crown,
  Flame,
  Shield,
  Skull,
  Star,
  Swords,
  Target,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayerStandings, useTeamStandings } from "@/hooks/useLeaderboard";
import { usePlayers } from "@/hooks/usePlayers";
import type { CachedPlayerStanding, CachedTeamStanding } from "@/types";

/* ── Individual record card ──────────────────────────────────────────────── */

interface RecordHero {
  type: "player" | "team";
  label: string;
  value: string;
  unit: string;
  holder: string;
  holderSub?: string;
  photoUrl?: string | null;
  color: string;
  icon: React.ElementType;
}

function RecordCard({ record, index }: { record: RecordHero; index: number }) {
  const Icon = record.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md transition-transform hover:-translate-y-0.5"
    >
      {/* Category header */}
      <div className={`flex items-center gap-2.5 border-b-4 border-ink px-5 py-3 ${record.color}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest">{record.label}</span>
      </div>

      {/* Record value */}
      <div className="bg-ink px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">{record.value}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-white/30">
            {record.unit}
          </span>
        </div>
      </div>

      {/* Record holder */}
      <div className="flex items-center gap-3 bg-cream px-5 py-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-vpurple/20">
          {record.photoUrl ? (
            <Image
              src={record.photoUrl}
              alt={record.holder}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : record.type === "team" ? (
            <div className="grid h-full place-items-center">
              <Shield className="h-5 w-5 text-ink/30" />
            </div>
          ) : (
            <div className="grid h-full place-items-center">
              <UserRound className="h-5 w-5 text-ink/30" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{record.holder}</p>
          {record.holderSub && (
            <p className="truncate text-xs font-bold uppercase text-ink/50">
              {record.holderSub}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

function RecordSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border-4 border-ink">
      <Skeleton className="h-11 w-full rounded-none" />
      <Skeleton className="h-20 w-full rounded-none bg-ink/80" />
      <Skeleton className="h-16 w-full rounded-none" />
    </div>
  );
}

export default function RecordsPage() {
  const { standings: playerSt, loading: pLoad } = usePlayerStandings();
  const { standings: teamSt, loading: tLoad } = useTeamStandings();
  const { data: players, loading: plLoad } = usePlayers();

  const loading = pLoad || tLoad || plLoad;

  /* --- derive record-holders (best performer per category) --- */
  const byKills = playerSt.slice().sort((a: CachedPlayerStanding, b: CachedPlayerStanding) => b.kills - a.kills);
  const byHS = playerSt.slice().sort((a: CachedPlayerStanding, b: CachedPlayerStanding) => b.headshots - a.headshots);
  const byDmg = playerSt.slice().sort((a: CachedPlayerStanding, b: CachedPlayerStanding) => b.damage - a.damage);
  const byMvp = playerSt.slice().sort((a: CachedPlayerStanding, b: CachedPlayerStanding) => b.mvpAwards - a.mvpAwards);
  const byTeamWins = teamSt.slice().sort((a: CachedTeamStanding, b: CachedTeamStanding) => b.wins - a.wins);
  const byTeamKills = teamSt.slice().sort((a: CachedTeamStanding, b: CachedTeamStanding) => b.kills - a.kills);
  const byTeamPts = teamSt.slice().sort((a: CachedTeamStanding, b: CachedTeamStanding) => b.points - a.points);
  const highestBid = players.slice().sort((a, b) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))[0];

  const allRecords: RecordHero[] = [
    {
      type: "player",
      label: "Kill Machine",
      value: String(byKills[0]?.kills ?? "—"),
      unit: "kills",
      holder: byKills[0]?.ign ?? "No record yet",
      holderSub: byKills[0]?.teamName,
      photoUrl: byKills[0]?.photoURL,
      color: "bg-vred",
      icon: Skull,
    },
    {
      type: "player",
      label: "Damage King",
      value: byDmg[0]?.damage?.toLocaleString() ?? "—",
      unit: "damage",
      holder: byDmg[0]?.ign ?? "No record yet",
      holderSub: byDmg[0]?.teamName,
      photoUrl: byDmg[0]?.photoURL,
      color: "bg-vpurple",
      icon: Flame,
    },
    {
      type: "player",
      label: "Headshot Master",
      value: String(byHS[0]?.headshots ?? "—"),
      unit: "headshots",
      holder: byHS[0]?.ign ?? "No record yet",
      holderSub: byHS[0]?.teamName,
      photoUrl: byHS[0]?.photoURL,
      color: "bg-vgreen",
      icon: Target,
    },
    {
      type: "player",
      label: "Award Magnet",
      value: String(byMvp[0]?.mvpAwards ?? "—"),
      unit: "MVP awards",
      holder: byMvp[0]?.ign ?? "No record yet",
      holderSub: byMvp[0]?.teamName,
      photoUrl: byMvp[0]?.photoURL,
      color: "bg-vyellow",
      icon: Star,
    },
    {
      type: "team",
      label: "Dynasty",
      value: String(byTeamWins[0]?.wins ?? "—"),
      unit: "wins",
      holder: byTeamWins[0]?.teamName ?? "No record yet",
      photoUrl: byTeamWins[0]?.logoUrl,
      color: "bg-vblue",
      icon: Trophy,
    },
    {
      type: "team",
      label: "Deadliest Franchise",
      value: String(byTeamKills[0]?.kills ?? "—"),
      unit: "team kills",
      holder: byTeamKills[0]?.teamName ?? "No record yet",
      photoUrl: byTeamKills[0]?.logoUrl,
      color: "bg-vred",
      icon: Swords,
    },
    {
      type: "team",
      label: "Points Leader",
      value: String(byTeamPts[0]?.points ?? "—"),
      unit: "points",
      holder: byTeamPts[0]?.teamName ?? "No record yet",
      photoUrl: byTeamPts[0]?.logoUrl,
      color: "bg-vgreen",
      icon: Crown,
    },
    {
      type: "player",
      label: "High Roller",
      value: highestBid?.soldPrice?.toLocaleString() ?? "—",
      unit: "coins",
      holder: highestBid?.ign ?? "No auction yet",
      holderSub: "Highest auction price",
      photoUrl: highestBid?.photoURL,
      color: "bg-vyellow",
      icon: Coins,
    },
  ];

  const records = loading
    ? allRecords
    : allRecords.filter(
        (r) => r.holder !== "No record yet" && r.holder !== "No auction yet",
      );

  return (
    <div className="min-h-dvh">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-ink px-5 py-20 text-center">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-vyellow bg-vyellow/10">
            <Zap className="h-10 w-10 text-vyellow" />
          </div>
          <h1 className="text-5xl font-bold text-white sm:text-6xl">Records</h1>
          <p className="mt-3 text-base font-medium text-white/50">
            The greatest numbers in VFFT history.
          </p>
        </motion.div>
      </div>

      {/* ── Records grid ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecordSkeleton key={i} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No records yet"
            message="Records are set when matches are played and stats are submitted."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((r, i) => (
              <RecordCard key={r.label} record={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
