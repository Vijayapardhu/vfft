"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { transfersCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { useCollectionData } from "@/hooks/useFirestore";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { processTransfer } from "@/services/adminService";
import { CheckCircle, XCircle } from "lucide-react";
import type { Transfer, WithId } from "@/types";

const statusBadge: Record<string, "yellow" | "green" | "red" | "blue"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export default function AdminTransfersPage() {
  const { data: transfers, loading } = useCollectionData<Transfer>(
    isFirebaseConfigured ? transfersCol() : null,
    [],
  );
  const { data: players } = usePlayers();
  const { data: teams } = useTeams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server enforces the rules (≤2/season, purse deduction, squad room, playoff lock).
  async function updateStatus(transfer: WithId<Transfer>, action: "approve" | "reject") {
    setSaving(true);
    setError(null);
    try {
      await processTransfer(transfer.id, action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer action failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Transfers" subtitle="Approve transfers — purse & limits enforced automatically" />

      {error && (
        <p className="mb-3 rounded-2xl border-4 border-ink bg-vred/20 p-3 text-sm font-bold text-vred">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {transfers.map((t) => {
          const player = players.find((p) => p.id === t.playerId);
          const fromTeam = teams.find((tm) => tm.id === t.fromTeamId);
          const toTeam = teams.find((tm) => tm.id === t.toTeamId);
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="truncate font-bold">{player?.ign ?? "Unknown"}</span>
                      <Badge variant={statusBadge[t.status] ?? "cream"}>{t.status}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-ink/60">
                      {fromTeam?.name ?? "Free Agent"} → {toTeam?.name ?? "Free Agent"}
                    </p>
                    {t.amount != null && (
                      <p className="text-sm font-bold">Fee: {t.amount.toLocaleString()} coins</p>
                    )}
                  </div>
                  {t.status === "pending" && (
                    <div className="flex gap-2">
                      <Button variant="green" size="sm" onClick={() => updateStatus(t, "approve")} disabled={saving}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button variant="red" size="sm" onClick={() => updateStatus(t, "reject")} disabled={saving}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {transfers.length === 0 && (
          <p className="text-sm font-medium text-ink/60">No transfer requests.</p>
        )}
      </div>
    </div>
  );
}
