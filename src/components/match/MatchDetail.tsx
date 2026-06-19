"use client";

import { MapPin, Shield } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { MatchRoomCredentials } from "@/components/match/MatchRoomCredentials";
import { MatchTeamActions } from "@/components/match/MatchTeamActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { formatMatchTime } from "@/lib/format";
import { useMatch, useMatchLineups, useMatchResults } from "@/hooks/useMatches";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeam } from "@/hooks/useTeams";
import { reviewLineup } from "@/services/lineupService";
import type { Lineup, Result, Team, WithId } from "@/types";

function TeamCrest({ team, label }: { team?: WithId<Team> | null; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-xs">
        {team?.logoUrl ? (
          <Image src={team.logoUrl} alt={team.name} fill className="object-cover" sizes="80px" />
        ) : (
          <Shield className="h-8 w-8 text-ink/40" />
        )}
      </div>
      <span className="truncate text-center text-sm font-bold uppercase">
        {team?.name ?? label}
      </span>
    </div>
  );
}

export function MatchDetail({ matchId }: { matchId: string }) {
  const { data: match, loading, error } = useMatch(matchId);
  const { data: team1 } = useTeam(match?.team1Id ?? null);
  const { data: team2 } = useTeam(match?.team2Id ?? null);
  const { data: results } = useMatchResults(matchId);
  const { data: lineups } = useMatchLineups(matchId);
  const { data: players } = usePlayers();
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);

  const ignById = useMemo(
    () => new Map(players.map((p) => [p.id, p.ign])),
    [players],
  );

  async function review(lineupId: string, action: "approve" | "reject") {
    setBusy(true);
    try {
      await reviewLineup(lineupId, action);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <FullScreenLoader />;
  if (error)
    return (
      <ErrorState
        message="Couldn't load this match."
        onRetry={() => window.location.reload()}
      />
    );
  if (!match)
    return (
      <EmptyState icon={Shield} title="Match not found" message="This fixture doesn't exist." />
    );

  const resultFor = (teamId: string): WithId<Result> | undefined =>
    results.find((r) => r.teamId === teamId);
  const lineupFor = (teamId: string): WithId<Lineup> | undefined =>
    lineups.find((l) => l.teamId === teamId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="rounded-3xl border-4 border-ink bg-cream p-5 shadow-brutal-md">
        <div className="mb-4 flex items-center justify-between">
          <Badge variant="cream">Match {match.matchNumber}</Badge>
          <Badge variant={match.status === "completed" ? "green" : match.status === "live" ? "red" : "blue"}>
            {match.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <TeamCrest team={team1} label="Team 1" />
          <div className="flex flex-col items-center">
            {match.status === "completed" ? (
              <div className="flex items-center gap-2 text-3xl font-bold">
                <span>{resultFor(match.team1Id)?.totalPoints ?? 0}</span>
                <span className="text-ink/40">-</span>
                <span>{resultFor(match.team2Id)?.totalPoints ?? 0}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-ink/40">VS</span>
            )}
          </div>
          <TeamCrest team={team2} label="Team 2" />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm font-bold text-ink/60">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {match.map || "Map TBD"}
          </span>
          <span>{formatMatchTime(match.scheduledAt)}</span>
          <span className="uppercase">{match.stage}</span>
        </div>
      </div>

      {/* Room credentials — admin editor + participant-only view */}
      <MatchRoomCredentials matchId={matchId} />

      {/* Captain actions — substitution request + raise dispute */}
      <MatchTeamActions match={match} />

      {/* Per-team lineups + results */}
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          { team: team1, id: match.team1Id, fallback: "Team 1" },
          { team: team2, id: match.team2Id, fallback: "Team 2" },
        ].map(({ team, id, fallback }) => {
          const lineup = lineupFor(id);
          const result = resultFor(id);
          return (
            <div key={id} className="rounded-3xl border-4 border-ink bg-cream p-5 shadow-brutal">
              <h3 className="mb-3 text-lg font-bold uppercase">{team?.name ?? fallback}</h3>

              {result && (
                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-xl font-bold">{result.kills}</div><div className="text-[10px] font-bold uppercase text-ink/50">Kills</div></div>
                  <div><div className="text-xl font-bold">{result.placementPoints}</div><div className="text-[10px] font-bold uppercase text-ink/50">Place</div></div>
                  <div><div className="text-xl font-bold">{result.totalPoints}</div><div className="text-[10px] font-bold uppercase text-ink/50">Total</div></div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-bold uppercase text-ink/50">
                Playing Four
                {lineup && (
                  <Badge
                    variant={
                      lineup.status === "approved"
                        ? "green"
                        : lineup.status === "rejected"
                          ? "red"
                          : "yellow"
                    }
                  >
                    {lineup.status}
                  </Badge>
                )}
              </div>
              {lineup ? (
                <>
                  <ul className="mt-1 space-y-1 text-sm font-medium">
                    {lineup.playingFour.map((pid) => (
                      <li key={pid} className="flex items-center justify-between">
                        <span>{ignById.get(pid) ?? "Player"}</span>
                        {pid === lineup.captainId && <Badge variant="red">C</Badge>}
                        {pid === lineup.viceCaptainId && <Badge variant="blue">VC</Badge>}
                      </li>
                    ))}
                  </ul>
                  {isAdmin && lineup.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="green"
                        size="sm"
                        disabled={busy}
                        onClick={() => review(lineup.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="red"
                        size="sm"
                        disabled={busy}
                        onClick={() => review(lineup.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm font-medium text-ink/50">
                  Lineup not submitted yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
