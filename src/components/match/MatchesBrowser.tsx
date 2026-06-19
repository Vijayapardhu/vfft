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
import { cn } from "@/lib/utils";
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

  const counts = useMemo(
    () => ({
      upcoming: matches.filter((m) => m.status === "upcoming").length,
      live: matches.filter((m) => m.status === "live").length,
      completed: matches.filter((m) => m.status === "completed").length,
    }),
    [matches],
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
      .sort((a, b) =>
        status === "completed"
          ? b.matchNumber - a.matchNumber // newest first for results
          : a.matchNumber - b.matchNumber, // earliest first for upcoming/live
      );
    if (items.length === 0) {
      return (
        <EmptyState
          icon={Swords}
          title={`No ${status} matches`}
          message={
            status === "live"
              ? "No matches are live right now — check back soon!"
              : "Fixtures appear here once the admin generates the schedule."
          }
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

  function tabLabel(status: MatchStatus, label: string) {
    const count = counts[status];
    const isLive = status === "live";
    return (
      <span className="flex items-center gap-1.5">
        {isLive && count > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vred opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-vred" />
          </span>
        )}
        {label}
        {!loading && count > 0 && (
          <span
            className={cn(
              "grid h-5 min-w-[1.25rem] place-items-center rounded-full px-1 text-[10px] font-bold",
              isLive ? "bg-vred text-white" : "bg-ink/10",
            )}
          >
            {count}
          </span>
        )}
      </span>
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
            { id: "upcoming", label: tabLabel("upcoming", "Upcoming"), content: section("upcoming") },
            { id: "live", label: tabLabel("live", "Live"), content: section("live") },
            { id: "completed", label: tabLabel("completed", "Results"), content: section("completed") },
          ]}
        />
      )}
    </div>
  );
}
