"use client";

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useTeamLeaderTeam } from "@/components/team/TeamLeaderShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { toast } from "@/hooks/useToast";
import { MAX_SQUAD_SIZE, MAX_TRANSFERS_PER_SEASON } from "@/constants/app";

export default function TeamManagePage() {
  const team = useTeamLeaderTeam();
  const [name, setName] = useState(team.name);
  const [primaryColor, setPrimaryColor] = useState(team.primaryColor ?? "");
  const [secondaryColor, setSecondaryColor] = useState(team.secondaryColor ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.teams, team.id), {
        name: name.trim() || team.name,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Team settings updated." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to update." });
    } finally {
      setSaving(false);
    }
  }

  const spent = (team.purse ?? 0) - (team.remainingPurse ?? 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Team Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor || "#000000"}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border-2 border-ink bg-cream"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor || "#000000"}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border-2 border-ink bg-cream"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
          <Button variant="yellow" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Franchise Finances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <span className="text-xs font-bold uppercase text-ink/40">Purse</span>
              <p className="text-lg font-bold">{team.purse.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <span className="text-xs font-bold uppercase text-ink/40">Remaining</span>
              <p className="text-lg font-bold text-vgreen">{team.remainingPurse.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <span className="text-xs font-bold uppercase text-ink/40">Spent</span>
              <p className="text-lg font-bold text-vred">{spent.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <span className="text-xs font-bold uppercase text-ink/40">Transfers</span>
              <p className="text-lg font-bold">
                {team.transfersUsed ?? 0}/{MAX_TRANSFERS_PER_SEASON}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <span className="text-xs font-bold uppercase text-ink/40">Squad Size</span>
              <p className="text-lg font-bold">
                {team.squad.length}/{MAX_SQUAD_SIZE}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
