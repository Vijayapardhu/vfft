"use client";

import { Shield, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { ROUTES } from "@/constants/routes";
import { usePlayerStandings, useTeamStandings } from "@/hooks/useLeaderboard";
import { formatNumber } from "@/lib/format";
import { type PlayerStandingMetric, rankPlayers } from "@/lib/standings";
import { cn } from "@/lib/utils";

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-2xl" />
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const bg =
    rank === 1 ? "bg-vyellow" : rank === 2 ? "bg-vpurple" : rank === 3 ? "bg-vblue" : "bg-cream";
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-ink font-bold",
        bg,
      )}
    >
      {rank}
    </span>
  );
}

function TeamStandings() {
  const { standings, loading, error } = useTeamStandings();
  if (loading) return <LoadingRows />;
  if (error)
    return <ErrorState message="Couldn't load standings." onRetry={() => window.location.reload()} />;
  if (standings.length === 0)
    return (
      <EmptyState icon={Shield} title="No teams yet" message="Standings appear once franchises and results exist." />
    );

  return (
    <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal">
      <div className="hidden grid-cols-[3rem_1fr_repeat(6,3rem)] gap-2 border-b-4 border-ink bg-ink px-4 py-3 text-xs font-bold uppercase text-cream sm:grid">
        <span>#</span><span>Team</span><span className="text-center">MP</span><span className="text-center">W</span><span className="text-center">L</span><span className="text-center">Kills</span><span className="text-center">NDR</span><span className="text-center">Pts</span>
      </div>
      {standings.map((t) => (
        <Link
          key={t.teamId}
          href={ROUTES.team(t.teamId)}
          className="flex items-center gap-3 border-b-2 border-ink/10 bg-cream px-4 py-3 last:border-b-0 hover:bg-vyellow/40 sm:grid sm:grid-cols-[3rem_1fr_repeat(6,3rem)] sm:gap-2"
        >
          <RankBadge rank={t.rank} />
          <span className="flex flex-1 items-center gap-2 font-bold uppercase">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border-2 border-ink bg-cream">
              {t.logoUrl ? <Image src={t.logoUrl} alt="" fill className="object-cover" sizes="32px" /> : <Shield className="h-4 w-4 text-ink/40" />}
            </span>
            <span className="line-clamp-1">{t.teamName}</span>
          </span>
          <span className="hidden text-center font-bold sm:block">{t.matchesPlayed}</span>
          <span className="hidden text-center font-bold sm:block">{t.wins}</span>
          <span className="hidden text-center font-bold sm:block">{t.losses}</span>
          <span className="hidden text-center font-bold sm:block">{t.kills}</span>
          <span
            className="hidden text-center font-bold sm:block"
            title="Net Death Ratio — kills minus deaths, normalized per match"
          >
            {typeof t.ndr === "number" ? t.ndr.toFixed(2) : t.ndr}
          </span>
          <span className="text-center text-lg font-bold sm:text-base">{t.points}</span>
        </Link>
      ))}
    </div>
  );
}

const METRICS: { id: PlayerStandingMetric; label: string }[] = [
  { id: "performanceScore", label: "Overall" },
  { id: "kills", label: "Kills" },
  { id: "headshots", label: "Headshots" },
  { id: "damage", label: "Damage" },
  { id: "mvpAwards", label: "MVP" },
];

function PlayerStandings() {
  const { standings, loading, error } = usePlayerStandings();
  const [metric, setMetric] = useState<PlayerStandingMetric>("performanceScore");

  if (loading) return <LoadingRows />;
  if (error)
    return <ErrorState message="Couldn't load player rankings." onRetry={() => window.location.reload()} />;
  if (standings.length === 0)
    return (
      <EmptyState icon={UserRound} title="No player stats yet" message="Rankings appear once match stats are recorded." />
    );

  const ranked = rankPlayers(standings, metric);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetric(m.id)}
            className={cn(
              "min-h-9 rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold uppercase",
              metric === m.id ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal">
        {ranked.map((p) => (
          <Link
            key={p.playerId}
            href={ROUTES.player(p.playerId)}
            className="flex items-center gap-3 border-b-2 border-ink/10 bg-cream px-4 py-3 last:border-b-0 hover:bg-vyellow/40"
          >
            <RankBadge rank={p.rank} />
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-ink bg-vpurple/40">
              {p.photoURL ? <Image src={p.photoURL} alt="" fill className="object-cover" sizes="36px" /> : <UserRound className="h-4 w-4 text-ink/40" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold uppercase">{p.ign}</span>
              <span className="block truncate text-xs font-medium text-ink/50">{p.teamName}</span>
            </span>
            <span className="text-xl font-bold">{formatNumber(p[metric])}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Leaderboard" subtitle="Team standings and player rankings." />
      <Tabs
        tabs={[
          { id: "teams", label: "Teams", content: <TeamStandings /> },
          { id: "players", label: "Players", content: <PlayerStandings /> },
        ]}
      />
    </div>
  );
}
