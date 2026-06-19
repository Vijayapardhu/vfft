"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { PlayerCard, PlayerCardSkeleton } from "@/components/cards/PlayerCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PLAYER_ROLE_LABELS, PLAYER_ROLES } from "@/constants/app";
import { usePlayers } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";
import type { PlayerRole } from "@/types";

type Filter = PlayerRole | "all";

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {children}
    </div>
  );
}

export function PlayersBrowser() {
  const { data, loading, error } = usePlayers();
  const [filter, setFilter] = useState<Filter>("all");

  const approved = data.filter((p) => p.status === "approved");
  const filtered = (
    filter === "all" ? approved : approved.filter((p) => p.role === filter)
  )
    .slice()
    .sort((a, b) => a.ign.localeCompare(b.ign));

  const filters: Filter[] = ["all", ...PLAYER_ROLES];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Players"
        subtitle="The auction pool and signed squads of the season."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "min-h-9 rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
              filter === f ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
            )}
          >
            {f === "all" ? "All" : PLAYER_ROLE_LABELS[f]}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState
          message="Couldn't load players."
          onRetry={() => window.location.reload()}
        />
      ) : loading ? (
        <Grid>
          {Array.from({ length: 10 }).map((_, i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players yet"
          message={
            approved.length === 0
              ? "Approved players appear here once registration and admin approval are complete."
              : "No players match this role."
          }
        />
      ) : (
        <Grid>
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </Grid>
      )}
    </div>
  );
}
