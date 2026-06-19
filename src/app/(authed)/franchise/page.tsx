"use client";

import { ArrowLeftRight, Coins, Skull, Swords, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { StatCard } from "@/components/cards/StatCard";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { MAX_SQUAD_SIZE, MAX_TRANSFERS_PER_SEASON } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useMatches } from "@/hooks/useMatches";
import { useTeams, useTeamSeasonStats } from "@/hooks/useTeams";
import { useTeamPlayers } from "@/hooks/usePlayers";

export default function FranchiseOverviewPage() {
  const team = useFranchiseTeam();
  const { data: stats } = useTeamSeasonStats(team.id);
  const { data: players } = useTeamPlayers(team.id);
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const spent = (team.purse ?? 0) - (team.remainingPurse ?? 0);

  const upcomingMatches = useMemo(() =>
    matches
      .filter((m) => (m.team1Id === team.id || m.team2Id === team.id) && m.status !== "completed")
      .sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))
      .slice(0, 2),
    [matches, team.id],
  );

  const topPlayer = useMemo(() =>
    players.slice().sort((a, b) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))[0] ?? null,
    [players],
  );

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Points" value={stats?.points ?? 0} icon={Trophy} variant="yellow" />
        <StatCard label="Wins" value={stats?.wins ?? 0} icon={Swords} variant="green" />
        <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="blue" />
        <StatCard label="Squad" value={`${team.squad?.length ?? 0}/${MAX_SQUAD_SIZE}`} icon={Users} variant="purple" />
        <StatCard label="Purse Left" value={(team.remainingPurse ?? 0).toLocaleString()} icon={Coins} variant="cream" />
        <StatCard label="Spent" value={spent.toLocaleString()} icon={Coins} variant="red" />
        <StatCard label="Matches" value={stats?.matchesPlayed ?? 0} icon={Swords} variant="blue" />
        <StatCard label="Transfers" value={`${team.transfersUsed ?? 0}/${MAX_TRANSFERS_PER_SEASON}`} icon={ArrowLeftRight} variant="blue" />
      </div>

      {/* Top player highlight */}
      {topPlayer && (
        <div className="rounded-3xl border-4 border-ink bg-vyellow p-4 shadow-brutal">
          <p className="text-xs font-bold uppercase text-ink/60 mb-1">Marquee Signing</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-ink bg-vpurple/30">
              {topPlayer.photoURL && (
                <img src={topPlayer.photoURL} alt={topPlayer.ign} className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="font-bold text-lg">{topPlayer.ign}</p>
              <p className="text-sm font-medium text-ink/60 capitalize">{topPlayer.role}</p>
            </div>
            {topPlayer.soldPrice && (
              <p className="ml-auto font-bold text-lg">{topPlayer.soldPrice.toLocaleString()} coins</p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Upcoming Matches</h2>
            <Link href={ROUTES.franchiseMatches} className="text-sm font-bold text-ink/50 hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingMatches.map((m) => (
              <MatchCard key={m.id} match={m} team1={teamById.get(m.team1Id)} team2={teamById.get(m.team2Id)} />
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Manage Brand", href: ROUTES.franchiseBrand },
          { label: "View Squad", href: ROUTES.franchiseSquad },
          { label: "Go to Auction", href: "/auction" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border-4 border-ink bg-cream px-4 py-3 text-center text-sm font-bold uppercase tracking-wide shadow-brutal-xs transition-transform hover:-translate-y-0.5 hover:bg-vyellow"
          >
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
