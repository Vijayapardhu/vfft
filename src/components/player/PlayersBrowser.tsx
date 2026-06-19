"use client";

import { Search, Users } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [search, setSearch] = useState("");

  const approved = data.filter((p) => p.status === "approved");

  const countByRole = useMemo(
    () =>
      PLAYER_ROLES.reduce<Record<string, number>>((acc, r) => {
        acc[r] = approved.filter((p) => p.role === r).length;
        return acc;
      }, {}),
    [approved],
  );

  const filtered = useMemo(() => {
    const byRole = filter === "all" ? approved : approved.filter((p) => p.role === filter);
    const q = search.trim().toLowerCase();
    return (q ? byRole.filter((p) => p.ign.toLowerCase().includes(q)) : byRole)
      .slice()
      .sort((a, b) => a.ign.localeCompare(b.ign));
  }, [approved, filter, search]);

  const filters: Filter[] = ["all", ...PLAYER_ROLES];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Players"
        subtitle="The auction pool and signed squads of the season."
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by IGN…"
          className="min-h-10 w-full rounded-2xl border-2 border-ink bg-cream pl-9 pr-4 text-sm font-medium placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-vyellow"
        />
      </div>

      {/* Role filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const count = f === "all" ? approved.length : (countByRole[f] ?? 0);
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
                filter === f ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
              )}
            >
              {f === "all" ? "All" : PLAYER_ROLE_LABELS[f]}
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                  filter === f ? "bg-cream/20 text-cream" : "bg-ink/10",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
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
          title={search ? `No results for "${search}"` : "No players yet"}
          message={
            search
              ? "Try a different name or clear the search."
              : approved.length === 0
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
