"use client";

import { Swords } from "lucide-react";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { useTeamLeaderTeam } from "@/components/team/TeamLeaderShell";
import { EmptyState } from "@/components/ui/empty-state";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";

export default function TeamHistoryPage() {
  const team = useTeamLeaderTeam();
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

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
