"use client";

import { motion } from "framer-motion";
import { Crown, Swords, Users, Zap } from "lucide-react";
import { useHallOfFame } from "@/hooks/useHallOfFame";
import { useTeam } from "@/hooks/useTeams";
import { usePlayer } from "@/hooks/usePlayers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { HallOfFameEntry, WithId } from "@/types";

function HallCard({ entry }: { entry: WithId<HallOfFameEntry> }) {
  const { data: champion } = useTeam(entry.championTeamId);
  const { data: mvp } = usePlayer(entry.mvpPlayerId);
  const { data: bestTeam } = useTeam(entry.bestTeamId);
  const { data: highestKills } = usePlayer(entry.highestKillsPlayerId);

  return (
    <Card className="transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-vyellow" />
          {entry.seasonName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-vyellow">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ink/50">Champion</p>
            <p className="text-sm font-bold">{champion?.name ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-vpurple">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ink/50">MVP</p>
            <p className="text-sm font-bold">{mvp?.ign ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-vgreen">
            <Swords className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ink/50">Best Team</p>
            <p className="text-sm font-bold">{bestTeam?.name ?? "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-vred">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ink/50">Highest Kills</p>
            <p className="text-sm font-bold">
              {highestKills?.ign ?? "—"} ({entry.highestKills ?? "—"})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HallOfFamePage() {
  const { data: entries, loading, error } = useHallOfFame();

  return (
    <div className="bg-grid min-h-dvh px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            <Crown className="mr-3 inline h-8 w-8 text-vyellow" />
            Hall of Fame
          </h1>
          <p className="text-base font-medium text-ink/60">
            Champions, MVPs and record holders
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl border-4 border-ink p-5">
                <Skeleton className="mb-4 h-6 w-40" />
                <Skeleton className="mb-2 h-10 w-full" />
                <Skeleton className="mb-2 h-10 w-full" />
                <Skeleton className="mb-2 h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load hall of fame." />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="No entries yet"
            message="Hall of Fame entries will be added when seasons conclude."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {entries.map((entry) => (
              <HallCard key={entry.id} entry={entry} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
