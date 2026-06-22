"use client";

import { Crosshair, Skull, Star, Swords, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MasteryDisplay } from "@/components/player/MasteryDisplay";
import { StatCard } from "@/components/cards/StatCard";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { PLAYER_ROLE_LABELS } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import {
  usePlayer,
  usePlayerMatchHistory,
  usePlayerSeasonStats,
} from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useTeam } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";

export function PlayerProfile({ playerId }: { playerId: string }) {
  const { data: player, loading, error } = usePlayer(playerId);
  const { data: team } = useTeam(player?.teamId ?? null);
  const { data: stats } = usePlayerSeasonStats(playerId);
  const { data: matchHistory } = usePlayerMatchHistory(playerId);
  const { data: matches } = useMatches();
  const { isAdmin, user } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (error)
    return (
      <ErrorState
        message="Couldn't load this player."
        onRetry={() => window.location.reload()}
      />
    );
  // Unapproved players are private — visible only to admins and the owner.
  const isOwner = !!player && !!user && player.uid === user.uid;
  if (!player || (player.status !== "approved" && !isAdmin && !isOwner))
    return (
      <EmptyState
        icon={UserRound}
        title="Player not found"
        message="This player profile doesn't exist."
      />
    );

  const matchNumberOf = (matchId: string) =>
    matches.find((m) => m.id === matchId)?.matchNumber ?? null;
  const history = [...matchHistory].sort(
    (a, b) => (matchNumberOf(b.matchId) ?? 0) - (matchNumberOf(a.matchId) ?? 0),
  );

  const brand = team?.primaryColor ?? "#6d28d9";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* ── Cinematic hero ──────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-lg"
        style={{ background: brand }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-ink/40" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end">
          {/* Photo — large */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-white/20 shadow-brutal sm:h-56 sm:w-44 sm:shrink-0">
            {player.photoURL ? (
              <Image
                src={player.photoURL}
                alt={player.ign}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 176px"
                priority
              />
            ) : (
              <div className="grid h-full place-items-center bg-white/10">
                <UserRound className="h-20 w-20 text-white/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3 sm:pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple">{PLAYER_ROLE_LABELS[player.role]}</Badge>
              {player.status !== "approved" && (
                <Badge variant="yellow">{player.status}</Badge>
              )}
            </div>
            <h1 className="text-5xl font-bold leading-none text-white drop-shadow-lg">
              {player.ign}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
              {team ? (
                <Link
                  href={ROUTES.team(team.id)}
                  className="text-white/80 underline hover:text-white"
                >
                  {team.name}
                </Link>
              ) : (
                <span className="text-white/40">Auction pool</span>
              )}
              {player.device && (
                <span className="text-white/50">{player.device}</span>
              )}
              {typeof player.soldPrice === "number" && (
                <span className="rounded-lg border border-vyellow/40 bg-vyellow/20 px-2 py-0.5 text-xs text-vyellow">
                  {player.soldPrice.toLocaleString()} coins
                </span>
              )}
              {typeof stats?.overallRank === "number" && stats.overallRank > 0 && (
                <span className="rounded-lg border border-vgreen/50 bg-vgreen/20 px-2 py-0.5 text-xs font-bold text-vgreen">
                  ⭐ Overall Rank #{stats.overallRank}
                </span>
              )}
            </div>

            {/* Stat chips */}
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                { label: "Kills", value: stats?.kills ?? 0 },
                { label: "Headshots", value: stats?.headshots ?? 0 },
                { label: "MVP", value: stats?.mvpAwards ?? 0 },
                { label: "Matches", value: stats?.matchesPlayed ?? 0 },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col rounded-xl border-2 border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    {label}
                  </span>
                  <span className="text-lg font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Mastery */}
      <MasteryDisplay player={player} />

      {/* Season stats */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Season Stats</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Overall Rank" value={stats?.overallRank ? `#${stats.overallRank}` : "—"} icon={Star} variant="purple" />
          <StatCard label="Rating" value={stats?.performanceScore ?? 0} icon={Star} variant="yellow" />
          <StatCard label="Matches" value={stats?.matchesPlayed ?? 0} icon={Swords} variant="blue" />
          <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="red" />
          <StatCard label="Headshots" value={stats?.headshots ?? 0} icon={Crosshair} variant="green" />
          <StatCard label="MVP" value={stats?.mvpAwards ?? 0} icon={Star} variant="yellow" />
        </div>
      </section>

      {/* Match history */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Match History</h2>
        {history.length === 0 ? (
          <div className="rounded-3xl border-4 border-dashed border-ink/30 p-8 text-center font-medium text-ink/50">
            No matches played yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border-4 border-ink shadow-brutal-sm">
            <div className="grid grid-cols-[1fr_auto] gap-3 bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-cream/50 sm:grid-cols-[auto_1fr_auto]">
              <span className="hidden sm:block">Match</span>
              <span>Performance</span>
              <span>Badges</span>
            </div>
            <div className="divide-y-4 divide-ink bg-cream">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto]"
                >
                  <span className="hidden sm:block font-bold text-ink/50 uppercase text-sm">
                    #{matchNumberOf(s.matchId) ?? "—"}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
                    <span><span className="text-ink/40 mr-1 text-xs">K</span>{s.kills}</span>
                    <span><span className="text-ink/40 mr-1 text-xs">HS</span>{s.headshots}</span>
                    <span><span className="text-ink/40 mr-1 text-xs">DMG</span>{s.damage}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.mvp && <Badge variant="yellow">MVP</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
