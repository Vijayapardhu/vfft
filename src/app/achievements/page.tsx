"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { usePlayer } from "@/hooks/usePlayers";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { Achievement } from "@/types";

function AchievementCard({ achievement }: { achievement: Achievement & { id: string } }) {
  const { data: player } = usePlayer(achievement.playerId);
  const label = achievement.type.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <Card className="transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
      <CardContent className="flex flex-col items-center gap-3 p-4">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/40">
          <img
            src={player?.photoURL ?? "/placeholder-player.svg"}
            alt={player?.ign ?? "Player"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex w-full flex-col items-center gap-1 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-vyellow">{label}</p>
          <p className="truncate text-sm font-bold">{player?.ign ?? "Unknown"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AchievementsPage() {
  const { data: achievements, loading, error } = useAchievements();

  return (
    <div className="bg-grid min-h-dvh px-5 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            <Award className="mr-3 inline h-8 w-8 text-vyellow" />
            Achievements
          </h1>
          <p className="text-base font-medium text-ink/60">
            Badges and honours earned by players
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border-4 border-ink p-5">
                <Skeleton className="mb-3 aspect-square w-full rounded-2xl" />
                <Skeleton className="mx-auto mb-2 h-4 w-24" />
                <Skeleton className="mx-auto h-5 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message="Failed to load achievements." />
        ) : achievements.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No achievements yet"
            message="Achievements will appear here as players earn them."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
