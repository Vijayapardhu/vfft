"use client";

import { AlertTriangle, Repeat } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useTeamPlayers } from "@/hooks/usePlayers";
import { raiseDispute, requestSubstitution } from "@/services/teamActionsService";
import type { Match, WithId } from "@/types";

/** Captain-only actions for a match: request a substitution + raise a dispute. */
export function MatchTeamActions({ match }: { match: WithId<Match> }) {
  const { user, role } = useAuth();
  const teamId = user?.teamId ?? null;
  const isLeader =
    (role === "teamLeader" || role === "franchiseOwner") &&
    !!teamId &&
    (match.team1Id === teamId || match.team2Id === teamId);

  const { data: squad } = useTeamPlayers(isLeader ? teamId : null);

  const [disputeReason, setDisputeReason] = useState("");
  const [outId, setOutId] = useState("");
  const [inId, setInId] = useState("");
  const [subReason, setSubReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!isLeader) return null;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border-4 border-ink bg-cream p-5 shadow-brutal">
      <h2 className="mb-3 text-xl">Team Actions</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Substitution */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase">
            <Repeat className="h-4 w-4" /> Request Substitution
          </h3>
          {match.status !== "upcoming" ? (
            <p className="text-xs font-medium text-ink/50">
              Substitutions are only allowed before the room starts.
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="sub-out">Player out</Label>
                <Select id="sub-out" value={outId} onChange={(e) => setOutId(e.target.value)}>
                  <option value="">Select</option>
                  {squad.map((p) => (
                    <option key={p.id} value={p.id}>{p.ign}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="sub-in">Player in</Label>
                <Select id="sub-in" value={inId} onChange={(e) => setInId(e.target.value)}>
                  <option value="">Select</option>
                  {squad.map((p) => (
                    <option key={p.id} value={p.id}>{p.ign}</option>
                  ))}
                </Select>
              </div>
              <Textarea
                value={subReason}
                onChange={(e) => setSubReason(e.target.value)}
                placeholder="Reason (optional)"
              />
              <Button
                variant="blue"
                size="sm"
                disabled={busy || !outId || !inId || outId === inId}
                onClick={() =>
                  run(
                    () =>
                      requestSubstitution({
                        matchId: match.id,
                        outPlayerId: outId,
                        inPlayerId: inId,
                        reason: subReason.trim(),
                      }),
                    "Substitution requested — pending admin approval.",
                  )
                }
              >
                Request Sub
              </Button>
            </>
          )}
        </div>

        {/* Dispute */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase">
            <AlertTriangle className="h-4 w-4" /> Raise Dispute
          </h3>
          <Textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="What went wrong?"
          />
          <Button
            variant="red"
            size="sm"
            disabled={busy || !disputeReason.trim()}
            onClick={() =>
              run(
                () =>
                  raiseDispute({
                    seasonId: match.seasonId,
                    matchId: match.id,
                    reason: disputeReason.trim(),
                  }),
                "Dispute raised — admins will review it.",
              )
            }
          >
            Raise Dispute
          </Button>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm font-bold text-vgreen">{msg}</p>}
      {err && <p className="mt-3 text-sm font-bold text-vred">{err}</p>}
    </div>
  );
}
