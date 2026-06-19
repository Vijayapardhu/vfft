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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="flex flex-col gap-5 rounded-3xl border-4 border-ink bg-cream p-5 shadow-brutal-md sm:flex-row sm:items-center">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/40 sm:h-40 sm:w-40">
          {player.photoURL ? (
            <Image
              src={player.photoURL}
              alt={player.ign}
              fill
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <UserRound className="h-20 w-20 text-ink/30" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">{PLAYER_ROLE_LABELS[player.role]}</Badge>
            {player.status !== "approved" && (
              <Badge variant="yellow">{player.status}</Badge>
            )}
          </div>
          <h1 className="text-4xl">{player.ign}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold">
            <span className="text-ink/60">
              Team:{" "}
              {team ? (
                <Link href={ROUTES.team(team.id)} className="text-ink underline">
                  {team.name}
                </Link>
              ) : (
                <span className="text-ink/40">Auction pool</span>
              )}
            </span>
            {typeof player.soldPrice === "number" && (
              <span className="text-vred">
                {player.soldPrice.toLocaleString()} coins
              </span>
            )}
            {player.device && (
              <span className="text-ink/60">Device: {player.device}</span>
            )}
          </div>
        </div>
      </div>

      {/* Game Mastery */}
      <MasteryDisplay player={player} />

      {/* Season stats */}
      <h2 className="mb-3 mt-8 text-2xl">Season Stats</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Matches" value={stats?.matchesPlayed ?? 0} icon={Swords} variant="blue" />
        <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="red" />
        <StatCard label="Headshots" value={stats?.headshots ?? 0} icon={Crosshair} variant="green" />
        <StatCard label="MVP" value={stats?.mvpAwards ?? 0} icon={Star} variant="yellow" />
      </div>

      <h2 className="mb-3 mt-8 text-2xl">Match History</h2>
      {history.length === 0 ? (
        <div className="rounded-3xl border-4 border-dashed border-ink/30 p-8 text-center font-medium text-ink/50">
          No matches played yet.
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-2xl border-4 border-ink bg-cream px-4 py-3 shadow-brutal-sm"
            >
              <span className="font-bold uppercase">
                Match {matchNumberOf(s.matchId) ?? "—"}
              </span>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span>{s.kills} K</span>
                <span>{s.headshots} HS</span>
                <span>{s.damage} DMG</span>
                {s.mvp && <Badge variant="yellow">MVP</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
