"use client";

import { useMemo } from "react";
import { Swords, Clock } from "lucide-react";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { MatchCard } from "@/components/cards/MatchCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useLineup } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { formatMatchTime } from "@/lib/format";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

function LineupStatusBadge({ matchId, teamId }: { matchId: string; teamId: string }) {
  const { data: lineup } = useLineup(matchId, teamId);
  if (!lineup) return <Badge variant="yellow">Lineup pending</Badge>;
  return (
    <Badge variant={lineup.status === "approved" ? "green" : lineup.status === "rejected" ? "red" : "yellow"}>
      Lineup {lineup.status}
    </Badge>
  );
}

export default function FranchiseMatchesPage() {
  const team = useFranchiseTeam();
  const { user } = useAuth();
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const myMatches = useMemo(
    () => matches.filter((m) => m.team1Id === team.id || m.team2Id === team.id),
    [matches, team.id],
  );

  const upcoming = myMatches.filter((m) => m.status !== "completed").sort(
    (a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0),
  );
  const completed = myMatches.filter((m) => m.status === "completed").sort(
    (a, b) => (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0),
  );

  return (
    <div className="space-y-8">
      {/* Upcoming */}
      <section>
        <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-vred" /> Upcoming Matches
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={Swords} title="No upcoming matches" message="Fixtures appear here once the admin schedules them." />
        ) : (
          <div className="space-y-4">
            {upcoming.map((m) => {
              const opponent = teamById.get(m.team1Id === team.id ? m.team2Id : m.team1Id);
              return (
                <div key={m.id} className="rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-ink/50">Match #{m.matchNumber}</p>
                      <p className="font-bold text-lg">vs {opponent?.name ?? "TBD"}</p>
                      <p className="text-sm font-medium text-ink/60">{formatMatchTime(m.scheduledAt)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <LineupStatusBadge matchId={m.id} teamId={team.id} />
                      <Link
                        href={ROUTES.teamLineup}
                        className="block text-xs font-bold uppercase text-ink/50 hover:text-ink"
                      >
                        Set lineup →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <Swords className="h-5 w-5" /> Match History
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                team1={teamById.get(m.team1Id)}
                team2={teamById.get(m.team2Id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
