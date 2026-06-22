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
import { useMatch, useMatchLineups, useMatchPlayerStats, useMatchResults } from "@/hooks/useMatches";
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
  const { data: playerStats } = useMatchPlayerStats(matchId);
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

  const score1 = resultFor(match.team1Id)?.totalPoints ?? 0;
  const score2 = resultFor(match.team2Id)?.totalPoints ?? 0;
  const isCompleted = match.status === "completed";
  const winner1 = isCompleted && score1 > score2;
  const winner2 = isCompleted && score2 > score1;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* ── Scoreboard header ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-lg">
        {/* Ink background VS section */}
        <div className="bg-ink px-4 py-6 sm:px-8">
          <div className="mb-5 flex items-center justify-between">
            <Badge variant="cream">Match {match.matchNumber}</Badge>
            <Badge variant={isCompleted ? "green" : match.status === "live" ? "red" : "blue"}>
              {match.status}
            </Badge>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Team 1 */}
            <div className={`flex flex-col items-center gap-2 transition-opacity ${winner2 ? "opacity-40" : ""}`}>
              <div className={`relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 bg-cream shadow-brutal-xs ${winner1 ? "border-vyellow" : "border-white/30"}`}>
                {team1?.logoUrl ? (
                  <Image src={team1.logoUrl} alt={team1.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <Shield className="h-8 w-8 text-ink/40" />
                )}
              </div>
              <span className="text-center text-sm font-bold uppercase text-white">
                {team1?.name ?? "Team 1"}
              </span>
              {winner1 && (
                <span className="text-xs font-bold uppercase tracking-widest text-vyellow">Winner</span>
              )}
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center gap-1 px-2 sm:px-4">
              {isCompleted ? (
                <>
                  <div className="flex items-baseline gap-3 text-5xl font-bold text-white leading-none sm:text-6xl">
                    <span className={winner1 ? "text-vyellow" : ""}>{score1}</span>
                    <span className="text-2xl text-white/20">·</span>
                    <span className={winner2 ? "text-vyellow" : ""}>{score2}</span>
                  </div>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Final
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-white/30">VS</span>
              )}
            </div>

            {/* Team 2 */}
            <div className={`flex flex-col items-center gap-2 transition-opacity ${winner1 ? "opacity-40" : ""}`}>
              <div className={`relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 bg-cream shadow-brutal-xs ${winner2 ? "border-vyellow" : "border-white/30"}`}>
                {team2?.logoUrl ? (
                  <Image src={team2.logoUrl} alt={team2.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <Shield className="h-8 w-8 text-ink/40" />
                )}
              </div>
              <span className="text-center text-sm font-bold uppercase text-white">
                {team2?.name ?? "Team 2"}
              </span>
              {winner2 && (
                <span className="text-xs font-bold uppercase tracking-widest text-vyellow">Winner</span>
              )}
            </div>
          </div>
        </div>

        {/* Map + meta bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 bg-ink/90 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white/40">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {match.map || "Map TBD"}
          </span>
          <span>{formatMatchTime(match.scheduledAt)}</span>
          <span>{match.stage}</span>
        </div>
      </div>

      {/* Room credentials — admin editor + participant-only view */}
      <MatchRoomCredentials matchId={matchId} />

      {/* Captain actions — substitution request + raise dispute */}
      <MatchTeamActions match={match} />

      {/* ── Kill Leaderboard (only after stats are entered) ──────── */}
      {playerStats.length > 0 && (
        <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
          <div className="bg-ink px-5 py-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cream/70">
              Kill Leaderboard
            </h2>
          </div>
          <div className="divide-y-4 divide-ink bg-cream">
            {[...playerStats]
              .sort((a, b) => b.kills - a.kills || b.headshots - a.headshots)
              .map((s, idx) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 ${s.mvp ? "bg-vyellow/20" : ""}`}
                >
                  {/* Rank */}
                  <span
                    className={`min-w-[28px] text-center text-sm font-bold ${idx === 0 ? "text-vyellow" : "text-ink/30"}`}
                  >
                    #{idx + 1}
                  </span>
                  {/* Name + team */}
                  <div>
                    <p className="font-bold">{ignById.get(s.playerId) ?? "Player"}</p>
                    <p className="text-xs font-bold text-ink/40 uppercase">
                      {s.teamId === match.team1Id ? team1?.name : team2?.name}
                    </p>
                  </div>
                  {/* Stats + MVP */}
                  <div className="flex items-center gap-3 text-right text-sm font-bold">
                    <span>
                      <span className="text-ink/40 text-xs mr-0.5">K</span>
                      {s.kills}
                    </span>
                    <span>
                      <span className="text-ink/40 text-xs mr-0.5">HS</span>
                      {s.headshots}
                    </span>
                    <span className="hidden sm:inline">
                      <span className="text-ink/40 text-xs mr-0.5">DMG</span>
                      {s.damage}
                    </span>
                    {s.mvp && <Badge variant="yellow">MVP</Badge>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Per-team lineups + results ────────────────────────────── */}
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
                  <div>
                    <div className="text-xl font-bold">{result.roundsWon ?? 0}</div>
                    <div className="text-[10px] font-bold uppercase text-ink/50">Rounds</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{result.kills}</div>
                    <div className="text-[10px] font-bold uppercase text-ink/50">Kills</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${result.outcome === "win" ? "text-vgreen" : ""}`}>
                      {result.outcome === "win" ? "WIN" : "LOSS"}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-ink/50">Result</div>
                  </div>
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
                        <div className="flex gap-1">
                          {pid === lineup.captainId && <Badge variant="red">C</Badge>}
                          {pid === lineup.viceCaptainId && <Badge variant="blue">VC</Badge>}
                        </div>
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
