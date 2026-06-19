"use client";

import { Swords } from "lucide-react";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { useTeamLeaderTeam } from "@/components/team/TeamLeaderShell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";

export default function TeamHistoryPage() {
  const team = useTeamLeaderTeam();
  const { data: matches, loading: mLoading, error: mError } = useMatches();
  const { data: teams, loading: tLoading } = useTeams();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  if (mLoading || tLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (mError) {
    return (
      <ErrorState
        message="Couldn't load match history."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const mine = matches
    .filter((m) => m.team1Id === team.id || m.team2Id === team.id)
    .sort((a, b) => b.matchNumber - a.matchNumber);

  if (mine.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="No matches yet"
        message="Your fixtures and results will appear here once the schedule is set."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mine.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          team1={teamById.get(m.team1Id)}
          team2={teamById.get(m.team2Id)}
        />
      ))}
    </div>
  );
}
