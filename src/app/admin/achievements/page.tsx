"use client";

import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { usePlayers } from "@/hooks/usePlayers";
import { useCollectionData } from "@/hooks/useFirestore";
import { toast } from "@/hooks/useToast";
import { achievementsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { Trash2, Award } from "lucide-react";
import type { Achievement, AchievementType } from "@/types";

const achievementTypes: AchievementType[] = [
  "champion", "mvp", "killMachine", "sniperKing", "clutchMaster", "terminator", "legend", "veteran",
];

export default function AdminAchievementsPage() {
  const { data: players } = usePlayers();
  const { data: achievements, loading } = useCollectionData<Achievement>(
    isFirebaseConfigured ? achievementsCol() : null,
    [],
  );
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedType, setSelectedType] = useState<AchievementType>("champion");
  const [saving, setSaving] = useState(false);

  async function handleGrant() {
    if (!selectedPlayer) return;
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS.achievements), {
        playerId: selectedPlayer,
        type: selectedType,
        awardedAt: serverTimestamp(),
        awardedBy: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ type: "success", message: "Achievement granted." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to grant achievement." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this achievement?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.achievements, id));
      toast({ type: "success", message: "Achievement revoked." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to revoke achievement." });
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Achievements" subtitle="Grant and manage player achievements" />

      <Card className="mb-6 max-w-xl">
        <CardHeader>
          <CardTitle>Grant Achievement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Player</Label>
              <Select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                <option value="">Select player</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.ign}</option>)}
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value as AchievementType)}>
                {achievementTypes.map((t) => <option key={t} value={t}>{t.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="yellow" onClick={handleGrant} disabled={!selectedPlayer || saving}>
              <Award className="h-4 w-4" /> Grant
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-bold uppercase tracking-tight">Granted Achievements</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const player = players.find((p) => p.id === a.playerId);
          return (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img src={player?.photoURL ?? "/placeholder-player.svg"} alt="" className="h-10 w-10 rounded-xl border-2 border-ink object-cover" />
                  <div>
                    <p className="truncate font-bold">{player?.ign ?? "Unknown"}</p>
                    <Badge variant="purple">{a.type}</Badge>
                  </div>
                </div>
                <button type="button" onClick={() => handleRevoke(a.id)} className="text-vred hover:text-vred/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
