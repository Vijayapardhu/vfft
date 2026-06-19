"use client";

import { Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Select } from "@/components/ui/input";
import { FullScreenLoader } from "@/components/ui/spinner";
import { PLAYING_SQUAD_SIZE } from "@/constants/app";
import { useAuth } from "@/hooks/useAuth";
import { useLineup, useMatches } from "@/hooks/useMatches";
import { useTeamPlayers } from "@/hooks/usePlayers";
import { useTeam, useTeams } from "@/hooks/useTeams";
import { formatMatchTime } from "@/lib/format";
import { lineupWindow } from "@/lib/lineup";
import { cn } from "@/lib/utils";
import { submitLineup } from "@/services/lineupService";
import type { Match, WithId } from "@/types";

export function LineupManager() {
  const { user, role, isLoading } = useAuth();
  const teamId = user?.teamId ?? null;
  const canManage =
    role === "teamLeader" || role === "franchiseOwner" || role === "admin";

  const { data: team } = useTeam(teamId);
  const { data: squad } = useTeamPlayers(teamId);
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const myMatches = useMemo(
    () =>
      matches
        .filter(
          (m) =>
            (m.team1Id === teamId || m.team2Id === teamId) &&
            m.status !== "completed",
        )
        .sort((a, b) => a.matchNumber - b.matchNumber),
    [matches, teamId],
  );

  const [matchId, setMatchId] = useState("");
  useEffect(() => {
    if (!matchId && myMatches[0]) setMatchId(myMatches[0].id);
  }, [myMatches, matchId]);

  // Re-tick so the window auto-locks at kickoff without a manual refresh.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: lineup } = useLineup(matchId || null, teamId);

  const [selected, setSelected] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState("");
  const [viceCaptainId, setViceCaptainId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Sync the form from the saved lineup whenever the match changes.
  useEffect(() => {
    setSelected(lineup?.playingFour ?? []);
    setCaptainId(lineup?.captainId ?? "");
    setViceCaptainId(lineup?.viceCaptainId ?? "");
    setOk(false);
    setError(null);
  }, [lineup, matchId]);

  // Keep captain/vice valid as the selection changes.
  useEffect(() => {
    if (captainId && !selected.includes(captainId)) setCaptainId("");
    if (viceCaptainId && !selected.includes(viceCaptainId)) setViceCaptainId("");
  }, [selected, captainId, viceCaptainId]);

  if (isLoading) return <FullScreenLoader />;
  if (!canManage || !teamId) {
    return (
      <EmptyState
        icon={Shield}
        title="Team captains only"
        message="This page is for team leaders and franchise owners managing a squad."
      />
    );
  }

  const approvedLock = lineup?.status === "approved" && lineup.locked === true;
  const selectedMatch = myMatches.find((m) => m.id === matchId) ?? null;
  const win = selectedMatch
    ? lineupWindow(
        selectedMatch.scheduledAt?.toMillis?.() ?? null,
        selectedMatch.status,
        nowMs,
      )
    : null;
  const windowClosed = win?.isClosed ?? false;
  // Editable while the window is open and the lineup isn't admin-locked.
  const editable = !approvedLock && !windowClosed;
  // Players-per-side for this specific match (admin-configurable room size).
  const teamSize = selectedMatch?.teamSize ?? PLAYING_SQUAD_SIZE;
  const ignById = new Map(squad.map((p) => [p.id, p.ign]));
  const valid =
    selected.length === teamSize &&
    !!captainId &&
    !!viceCaptainId &&
    captainId !== viceCaptainId;

  function toggle(pid: string) {
    if (!editable) return;
    setOk(false);
    setSelected((prev) => {
      if (prev.includes(pid)) return prev.filter((p) => p !== pid);
      if (prev.length >= teamSize) return prev;
      return [...prev, pid];
    });
  }

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      await submitLineup({ matchId, playingFour: selected, captainId, viceCaptainId });
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setBusy(false);
    }
  }

  const opponentName = (m: WithId<Match>) =>
    teamById.get(m.team1Id === teamId ? m.team2Id : m.team1Id)?.name ?? "TBD";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl">Match-Day Lineup</h1>
      <p className="mb-6 mt-1 font-medium text-ink/60">
        {team?.name ?? "Your team"} — pick your Playing 4, captain & vice-captain.
      </p>

      {myMatches.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No upcoming matches"
          message="Your fixtures appear here once the admin schedules them."
        />
      ) : (
        <div className="space-y-5">
          <div>
            <Label>Match</Label>
            <Select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
              {myMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  Match #{m.matchNumber} vs {opponentName(m)} · {formatMatchTime(m.scheduledAt)}
                </option>
              ))}
            </Select>
          </div>

          {lineup && (
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              Status:
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
              {approvedLock && <span className="text-ink/60">(locked — approved)</span>}
            </div>
          )}
          {lineup?.status === "rejected" && lineup.rejectedReason && (
            <p className="text-sm font-bold text-vred">
              Rejected: {lineup.rejectedReason}
            </p>
          )}

          {selectedMatch && (
            editable ? (
              <p className="rounded-2xl border-4 border-ink bg-vgreen/20 px-4 py-2 text-sm font-bold">
                Window open — submissions lock at kickoff (
                {formatMatchTime(selectedMatch.scheduledAt)}).
              </p>
            ) : (
              <p className="rounded-2xl border-4 border-ink bg-vred/15 px-4 py-2 text-sm font-bold">
                {approvedLock
                  ? "Lineup locked — approved by admin."
                  : "Submissions closed — the match has started."}
              </p>
            )
          )}

          <div>
            <Label>
              Playing {teamSize} ({selected.length}/{teamSize})
            </Label>
            {squad.length === 0 ? (
              <p className="text-sm font-medium text-ink/50">
                Your squad fills up through the auction.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {squad.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!editable}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "min-h-11 truncate rounded-2xl border-4 border-ink px-3 py-2 text-sm font-bold uppercase",
                      selected.includes(p.id) ? "bg-vgreen" : "bg-cream hover:bg-vyellow",
                      !editable && "opacity-60",
                    )}
                  >
                    {p.ign}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Captain</Label>
                <Select
                  value={captainId}
                  disabled={!editable}
                  onChange={(e) => setCaptainId(e.target.value)}
                >
                  <option value="">Select</option>
                  {selected.map((pid) => (
                    <option key={pid} value={pid}>
                      {ignById.get(pid)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Vice-Captain</Label>
                <Select
                  value={viceCaptainId}
                  disabled={!editable}
                  onChange={(e) => setViceCaptainId(e.target.value)}
                >
                  <option value="">Select</option>
                  {selected.map((pid) => (
                    <option key={pid} value={pid}>
                      {ignById.get(pid)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {editable && (
            <Button
              variant="red"
              size="lg"
              className="w-full"
              disabled={busy || !valid}
              onClick={submit}
            >
              {busy ? "Submitting…" : "Submit Lineup"}
            </Button>
          )}
          {ok && (
            <p className="text-center text-sm font-bold text-vgreen">
              Lineup submitted! Waiting for admin approval.
            </p>
          )}
          {error && (
            <p className="text-center text-sm font-bold text-vred">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
