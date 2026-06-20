"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { lineupsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { processLineup } from "@/services/adminService";
import { toast } from "@/hooks/useToast";
import { CheckCircle, Lock, Star, XCircle } from "lucide-react";
import type { Lineup, WithId } from "@/types";

const statusBadge: Record<string, "yellow" | "green" | "red"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

function toMillis(value: unknown): number {
  return (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
}

export default function AdminLineupsPage() {
  const { data: lineups, loading } = useCollectionData<Lineup>(
    isFirebaseConfigured ? lineupsCol() : null,
    [],
  );
  const { data: players } = usePlayers();
  const { data: teams } = useTeams();
  const { data: matches } = useMatches();
  const [busy, setBusy] = useState<string | null>(null);

  // Pending first, then newest submissions.
  const sorted = useMemo(
    () =>
      [...lineups].sort((a, b) => {
        const pa = a.status === "pending" ? 0 : 1;
        const pb = b.status === "pending" ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return toMillis((b as unknown as { submittedAt?: unknown }).submittedAt) -
          toMillis((a as unknown as { submittedAt?: unknown }).submittedAt);
      }),
    [lineups],
  );
  const pendingCount = lineups.filter((l) => l.status === "pending").length;

  const ign = (id: string) => players.find((p) => p.id === id)?.ign ?? "Unknown";

  async function act(lineup: WithId<Lineup>, action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      const r = prompt("Reason for rejecting this lineup (optional):") ?? "";
      reason = r.trim() || undefined;
    }
    setBusy(lineup.id);
    try {
      await processLineup(lineup.id, action, reason);
      toast({
        type: "success",
        message: action === "approve" ? "Lineup approved & locked." : "Lineup rejected.",
      });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update lineup." });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader
        title="Lineups"
        subtitle={pendingCount > 0 ? `${pendingCount} pending approval` : "Match-day lineup submissions"}
      />

      <div className="grid gap-3">
        {sorted.map((l) => {
          const team = teams.find((t) => t.id === l.teamId);
          const match = matches.find((m) => m.id === l.matchId);
          const opponent = match
            ? teams.find((t) => t.id === (match.team1Id === l.teamId ? match.team2Id : match.team1Id))
            : undefined;
          return (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{team?.name ?? "Team"}</span>
                      <span className="text-sm font-medium text-ink/50">
                        · Match {match?.matchNumber ?? `#${l.matchId.slice(0, 6)}`}
                        {opponent ? ` vs ${opponent.name}` : ""}
                      </span>
                      <Badge variant={statusBadge[l.status] ?? "yellow"}>{l.status}</Badge>
                      {l.locked && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/50">
                          <Lock className="h-3 w-3" /> locked
                        </span>
                      )}
                    </div>

                    {/* Playing roster with captain / vice markers */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(l.playingFour ?? []).map((pid) => {
                        const isC = pid === l.captainId;
                        const isVC = pid === l.viceCaptainId;
                        return (
                          <span
                            key={pid}
                            className={`inline-flex items-center gap-1 rounded-lg border-2 border-ink px-2 py-0.5 text-xs font-bold ${
                              isC ? "bg-vyellow" : isVC ? "bg-vblue" : "bg-cream"
                            }`}
                          >
                            {(isC || isVC) && <Star className="h-3 w-3" />}
                            {ign(pid)}
                            {isC ? " (C)" : isVC ? " (VC)" : ""}
                          </span>
                        );
                      })}
                    </div>

                    {l.status === "rejected" && l.rejectedReason && (
                      <p className="mt-1 text-xs font-medium text-vred">Reason: {l.rejectedReason}</p>
                    )}
                  </div>

                  {l.status === "pending" && (
                    <div className="flex gap-2">
                      <Button variant="green" size="sm" onClick={() => act(l, "approve")} disabled={busy !== null}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button variant="red" size="sm" onClick={() => act(l, "reject")} disabled={busy !== null}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm font-medium text-ink/60">No lineup submissions yet.</p>
        )}
      </div>
    </div>
  );
}
