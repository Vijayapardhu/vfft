"use client";

import { Swords } from "lucide-react";
import { useMemo } from "react";
import { MatchCard } from "@/components/cards/MatchCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import type { MatchStatus } from "@/types";

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function MatchesBrowser() {
  const { data: matches, loading, error } = useMatches();
  const { data: teams } = useTeams();
  const teamById = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams],
  );

  function section(status: MatchStatus) {
    if (loading) {
      return (
        <Grid>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </Grid>
      );
    }
    const items = matches
      .filter((m) => m.status === status)
      .sort((a, b) => a.matchNumber - b.matchNumber);
    if (items.length === 0) {
      return (
        <EmptyState
          icon={Swords}
          title={`No ${status} matches`}
          message="Fixtures appear here once the admin generates the schedule."
        />
      );
    }
    return (
      <Grid>
        {items.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            team1={teamById.get(m.team1Id)}
            team2={teamById.get(m.team2Id)}
          />
        ))}
      </Grid>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader title="Matches" subtitle="Fixtures, live games and results." />
      {error ? (
        <ErrorState
          message="Couldn't load matches."
          onRetry={() => window.location.reload()}
        />
      ) : (
        <Tabs
          tabs={[
            { id: "upcoming", label: "Upcoming", content: section("upcoming") },
            { id: "live", label: "Live", content: section("live") },
            { id: "completed", label: "Completed", content: section("completed") },
          ]}
        />
      )}
    </div>
  );
}
