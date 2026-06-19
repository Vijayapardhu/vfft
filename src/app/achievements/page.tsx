"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useAchievements } from "@/hooks/useAchievements";
import { usePlayers } from "@/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ROUTES } from "@/constants/routes";
import type { Achievement, WithId, Player } from "@/types";

function formatLabel(type: string): string {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function AchievementCard({
  achievement,
  player,
}: {
  achievement: Achievement & { id: string };
  player: WithId<Player> | undefined;
}) {
  const label = formatLabel(achievement.type);
  const href = player ? ROUTES.player(player.id) : undefined;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border-4 border-ink bg-cream shadow-brutal-sm transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-vpurple/40">
        <Image
          src={player?.photoURL ?? "/placeholder-player.svg"}
          alt={player?.ign ?? "Player"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="flex flex-col items-center gap-1 p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-vyellow">{label}</p>
        <p className="truncate text-sm font-bold">{player?.ign ?? "Unknown Player"}</p>
      </div>
    </motion.div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

export default function AchievementsPage() {
  const { data: achievements, loading: aLoading, error } = useAchievements();
  const { data: players, loading: pLoading } = usePlayers();

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const loading = aLoading || pLoading;

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border-4 border-ink">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="mx-auto mb-2 h-3 w-20" />
                  <Skeleton className="mx-auto h-4 w-28" />
                </div>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {achievements.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                player={playerById.get(a.playerId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
