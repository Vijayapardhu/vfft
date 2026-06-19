"use client";

import { Shield } from "lucide-react";
import { TeamCard, TeamCardSkeleton } from "@/components/cards/TeamCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { useTeams } from "@/hooks/useTeams";

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function TeamsBrowser() {
  const { data, loading, error } = useTeams();
  const sorted = data.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Teams"
        subtitle="The franchises battling for the title."
      />

      {error ? (
        <ErrorState
          message="Couldn't load teams."
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <Grid>
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </Grid>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No teams yet"
          message="Franchises appear here once an admin creates them for the season."
        />
      ) : (
        <Grid>
          {sorted.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </Grid>
      )}
    </div>
  );
}
