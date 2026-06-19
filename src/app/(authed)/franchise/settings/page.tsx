"use client";

import { useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Settings } from "lucide-react";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { toast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { usePlayers } from "@/hooks/usePlayers";
import { MAX_SQUAD_SIZE, MAX_TRANSFERS_PER_SEASON, FRANCHISE_BUDGET } from "@/constants/app";

export default function FranchiseSettingsPage() {
  const team = useFranchiseTeam();
  const { role, user } = useAuth();
  const { data: allPlayers } = usePlayers();
  const canEdit = role === "franchiseOwner" || role === "admin";

  const squadPlayers = allPlayers.filter((p) => p.teamId === team.id);
  const [newLeaderUid, setNewLeaderUid] = useState(team.teamLeaderUid);
  const [saving, setSaving] = useState(false);

  const spent = (team.purse ?? 0) - (team.remainingPurse ?? 0);

  async function handleSaveLeader() {
    if (!newLeaderUid.trim()) return;
    setSaving(true);
    try {
      // Update team leader
      await updateDoc(doc(db, COLLECTIONS.teams, team.id), {
        teamLeaderUid: newLeaderUid,
        updatedAt: serverTimestamp(),
      });
      // Update new leader's user doc
      const newLeaderSnap = await getDoc(doc(db, COLLECTIONS.users, newLeaderUid));
      if (newLeaderSnap.exists()) {
        const current = newLeaderSnap.data();
        if (current.role !== "admin" && current.role !== "franchiseOwner") {
          await updateDoc(doc(db, COLLECTIONS.users, newLeaderUid), {
            role: "teamLeader",
            teamId: team.id,
            updatedAt: serverTimestamp(),
          });
        }
      }
      toast({ type: "success", message: "Team leader updated!" });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Franchise Settings</h1>
      </div>

      {/* Finance overview */}
      <Card>
        <CardHeader><CardTitle>Finance Center</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total Purse" value={`${(team.purse ?? 0).toLocaleString()} coins`} />
            <Stat label="Remaining" value={`${(team.remainingPurse ?? 0).toLocaleString()} coins`} color="text-vgreen" />
            <Stat label="Spent" value={`${spent.toLocaleString()} coins`} color="text-vred" />
            <Stat label="Transfers Used" value={`${team.transfersUsed ?? 0} / ${MAX_TRANSFERS_PER_SEASON}`} />
          </div>
        </CardContent>
      </Card>

      {/* Roster info */}
      <Card>
        <CardHeader><CardTitle>Roster Info</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Squad Size" value={`${team.squad?.length ?? 0} / ${MAX_SQUAD_SIZE}`} />
            <Stat label="Slots Remaining" value={String(MAX_SQUAD_SIZE - (team.squad?.length ?? 0))} />
          </div>
        </CardContent>
      </Card>

      {/* Team leader */}
      <Card>
        <CardHeader><CardTitle>Team Leader</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border-2 border-ink/20 bg-cream p-3">
            <p className="text-xs font-bold uppercase text-ink/50 mb-1">Current Leader UID</p>
            <p className="font-mono text-sm font-bold truncate">{team.teamLeaderUid}</p>
          </div>
          {canEdit && squadPlayers.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label>Assign New Team Leader</Label>
                <Select value={newLeaderUid} onChange={(e) => setNewLeaderUid(e.target.value)}>
                  <option value="">Select a player from your squad…</option>
                  {squadPlayers.map((p) => (
                    <option key={p.uid ?? p.id} value={p.uid ?? p.id}>
                      {p.ign} {p.uid === team.teamLeaderUid ? "(current leader)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="yellow"
                disabled={saving || !newLeaderUid || newLeaderUid === team.teamLeaderUid}
                onClick={handleSaveLeader}
              >
                {saving ? "Saving…" : "Update Team Leader"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone hint */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-sm">
            <p className="font-bold">Role: <Badge variant="purple">Franchise Owner</Badge></p>
            <p className="mt-1 font-medium text-ink/60">
              Your franchise is bound to this account. Contact an admin to transfer ownership.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
      <span className="text-xs font-bold uppercase text-ink/40">{label}</span>
      <p className={`mt-0.5 text-lg font-bold ${color ?? ""}`}>{value}</p>
    </div>
  );
}
