"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionData } from "@/hooks/useFirestore";
import { substitutionsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { processSubstitution } from "@/services/adminService";
import { toast } from "@/hooks/useToast";
import { CheckCircle, XCircle } from "lucide-react";
import type { Substitution, WithId } from "@/types";

const statusBadge: Record<string, "yellow" | "green" | "red"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

export default function AdminSubstitutionsPage() {
  const { data: substitutions, loading } = useCollectionData<Substitution>(
    isFirebaseConfigured ? substitutionsCol() : null,
    [],
  );
  const { data: players } = usePlayers();
  const { data: matches } = useMatches();
  const [saving, setSaving] = useState(false);

  async function updateStatus(sub: WithId<Substitution>, action: "approve" | "reject") {
    setSaving(true);
    try {
      // Server route applies the lineup swap and records the admin's uid.
      await processSubstitution(sub.id, action);
      toast({
        type: "success",
        message: action === "approve" ? "Substitution approved & applied." : "Substitution rejected.",
      });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Substitutions" subtitle="Manage emergency substitutions" />

      <div className="grid gap-3">
        {substitutions.map((s) => {
          const outPlayer = players.find((p) => p.id === s.outPlayerId);
          const inPlayer = players.find((p) => p.id === s.inPlayerId);
          const match = matches.find((m) => m.id === s.matchId);
          return (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Match {match?.matchNumber ?? `#${s.matchId.slice(0, 8)}`}</span>
                      <Badge variant={statusBadge[s.status]}>{s.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      Out: <span className="truncate font-bold text-vred">{outPlayer?.ign ?? "Unknown"}</span>
                      {" → "}
                      In: <span className="truncate font-bold text-vgreen">{inPlayer?.ign ?? "Unknown"}</span>
                    </p>
                    <p className="text-xs font-medium text-ink/60">Reason: {s.reason}</p>
                  </div>
                  {s.status === "pending" && (
                    <div className="flex gap-2">
                      <Button variant="green" size="sm" onClick={() => updateStatus(s, "approve")} disabled={saving}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button variant="red" size="sm" onClick={() => updateStatus(s, "reject")} disabled={saving}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && substitutions.length === 0 && (
          <p className="text-sm font-medium text-ink/60">No substitution requests.</p>
        )}
      </div>
    </div>
  );
}
