"use client";

import { Coins, Shield, Skull, Swords, Trophy, Users } from "lucide-react";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { PlayerCard, PlayerCardSkeleton } from "@/components/cards/PlayerCard";
import { StatCard } from "@/components/cards/StatCard";
import { TeamPerformanceChart } from "@/components/charts/TeamPerformanceChart";
import { TeamBanner } from "@/components/team/TeamBanner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { Tabs } from "@/components/ui/tabs";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { useTeamPlayers } from "@/hooks/usePlayers";
import { useTeam, useTeamSeasonStats } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";

export function TeamProfile({ teamId }: { teamId: string }) {
  const { data: team, loading, error } = useTeam(teamId);
  const { data: players, loading: playersLoading } = useTeamPlayers(teamId);
  const { data: stats } = useTeamSeasonStats(teamId);
  const { data: allMatches } = useMatches();
  const { data: allTeams } = useTeams();

  const teamById = useMemo(() => new Map(allTeams.map((t) => [t.id, t])), [allTeams]);

  const teamMatches = useMemo(
    () =>
      allMatches
        .filter((m) => m.team1Id === teamId || m.team2Id === teamId)
        .sort((a, b) => b.matchNumber - a.matchNumber),
    [allMatches, teamId],
  );

  const completedMatches = useMemo(
    () => teamMatches.filter((m) => m.status === "completed"),
    [teamMatches],
  );

  if (loading) return <FullScreenLoader />;
  if (error)
    return (
      <ErrorState
        message="Couldn't load this team."
        onRetry={() => window.location.reload()}
      />
    );
  if (!team)
    return (
      <EmptyState
        icon={Shield}
        title="Team not found"
        message="This franchise doesn't exist."
      />
    );

  const overview = (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <StatCard label="Points" value={stats?.points ?? 0} icon={Trophy} variant="yellow" />
      <StatCard label="Wins" value={stats?.wins ?? 0} icon={Swords} variant="green" />
      <StatCard label="Losses" value={stats?.losses ?? 0} variant="red" />
      <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="blue" />
      <StatCard
        label="Squad"
        value={`${team.squad?.length ?? 0}/${MAX_SQUAD_SIZE}`}
        icon={Users}
        variant="purple"
      />
      <StatCard
        label="Purse Left"
        value={(team.remainingPurse ?? 0).toLocaleString()}
        icon={Coins}
        variant="cream"
      />
    </div>
  );

  const squad = playersLoading ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  ) : players.length === 0 ? (
    <EmptyState
      icon={Users}
      title="No players yet"
      message="This team's squad fills up through the auction."
    />
  ) : (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {players
        .slice()
        .sort((a, b) => a.ign.localeCompare(b.ign))
        .map((p) => (
          <PlayerCard key={p.id} player={p} />
        ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <TeamBanner team={team} />
      <div className="mt-6">
        <Tabs
          tabs={[
            { id: "overview", label: "Overview", content: overview },
            { id: "squad", label: "Squad", content: squad },
            {
              id: "stats",
              label: "Statistics",
              content: <TeamPerformanceChart teamId={team.id} />,
            },
            {
              id: "matches",
              label: "Matches",
              content: teamMatches.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="No matches yet"
                  message="Fixtures will appear here once the schedule is set."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {teamMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      team1={teamById.get(m.team1Id)}
                      team2={teamById.get(m.team2Id)}
                    />
                  ))}
                </div>
              ),
            },
            {
              id: "history",
              label: "History",
              content: (
                <div className="space-y-6">
                  {completedMatches.length > 0 && (
                    <div className="rounded-2xl border-4 border-ink bg-cream p-4">
                      <h3 className="mb-3 text-lg font-bold">Season Summary</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                          <span className="text-xs font-bold uppercase text-ink/40">Played</span>
                          <p className="text-xl font-bold">{completedMatches.length}</p>
                        </div>
                        <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                          <span className="text-xs font-bold uppercase text-ink/40">Wins</span>
                          <p className="text-xl font-bold text-vgreen">{stats?.wins ?? 0}</p>
                        </div>
                        <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                          <span className="text-xs font-bold uppercase text-ink/40">Losses</span>
                          <p className="text-xl font-bold text-vred">{stats?.losses ?? 0}</p>
                        </div>
                        <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
                          <span className="text-xs font-bold uppercase text-ink/40">Kills</span>
                          <p className="text-xl font-bold">{stats?.kills ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {completedMatches.length === 0 ? (
                    <EmptyState
                      icon={Swords}
                      title="No completed matches"
                      message="Completed match results will appear here."
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {completedMatches.map((m) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          team1={teamById.get(m.team1Id)}
                          team2={teamById.get(m.team2Id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
