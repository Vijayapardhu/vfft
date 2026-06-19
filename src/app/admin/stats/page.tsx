"use client";

import { useState, useMemo } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Spinner } from "@/components/ui/spinner";
import { useMatches } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useTeamPlayers } from "@/hooks/usePlayers";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { Save, RefreshCw } from "lucide-react";
import { auth } from "@/firebase/auth";

export default function AdminStatsPage() {
  const { data: matches, loading } = useMatches();
  const { data: teams } = useTeams();
  const { seasonId } = useActiveSeason();
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [kills, setKills] = useState(0);
  const [damage, setDamage] = useState(0);
  const [headshots, setHeadshots] = useState(0);
  const [mvp, setMvp] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);

  const completedOrLive = useMemo(
    () => matches.filter((m) => m.status === "completed" || m.status === "live"),
    [matches],
  );

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const matchTeams = useMemo(() => {
    if (!selectedMatch) return [];
    return teams.filter((t) => t.id === selectedMatch.team1Id || t.id === selectedMatch.team2Id);
  }, [selectedMatch, teams]);

  const { data: teamPlayers } = useTeamPlayers(selectedTeamId);

  async function handleSave() {
    if (!selectedMatchId || !selectedPlayerId || !seasonId || !evidenceUrl) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid ?? "admin";
      // Deterministic per (match, player) ids → idempotent corrections instead
      // of duplicate stat rows that would double-count the leaderboard.
      const statId = `${selectedMatchId}_${selectedPlayerId}`;
      await setDoc(
        doc(db, COLLECTIONS.resultEvidence, statId),
        {
          matchId: selectedMatchId,
          screenshotUrl: evidenceUrl,
          uploadedBy: uid,
          uploadedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await setDoc(
        doc(db, COLLECTIONS.playerMatchStats, statId),
        {
          seasonId,
          matchId: selectedMatchId,
          playerId: selectedPlayerId,
          teamId: selectedTeamId,
          kills,
          damage,
          headshots,
          mvp,
          evidenceId: statId,
          enteredBy: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/standings/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ seasonId }),
      }).catch(() => {});
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Player Stats" subtitle="Enter per-player match statistics" />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Stats Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Match</Label>
              <Select value={selectedMatchId} onChange={(e) => { setSelectedMatchId(e.target.value); setSelectedTeamId(""); setSelectedPlayerId(""); }}>
                <option value="">Select match</option>
                {completedOrLive.map((m) => (
                  <option key={m.id} value={m.id}>
                    Match #{m.matchNumber}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Team</Label>
              <Select value={selectedTeamId} onChange={(e) => { setSelectedTeamId(e.target.value); setSelectedPlayerId(""); }}>
                <option value="">Select team</option>
                {matchTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Player</Label>
              <Select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}>
                <option value="">Select player</option>
                {teamPlayers.map((p) => <option key={p.id} value={p.id}>{p.ign}</option>)}
              </Select>
            </div>
          </div>

          {selectedPlayerId && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Kills</Label>
                  <Input type="number" min={0} value={kills} onChange={(e) => setKills(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Damage</Label>
                  <Input type="number" min={0} value={damage} onChange={(e) => setDamage(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Headshots</Label>
                  <Input type="number" min={0} value={headshots} onChange={(e) => setHeadshots(Number(e.target.value))} />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={mvp} onChange={(e) => setMvp(e.target.checked)} className="h-5 w-5 accent-vyellow" />
                <span className="text-sm font-bold uppercase">MVP</span>
              </label>

              <div>
                <Label>Screenshot Evidence</Label>
                <ImageUploader value={evidenceUrl} onChange={setEvidenceUrl} folder="match-evidence" />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="yellow" onClick={handleSave} disabled={!evidenceUrl || saving}>
                  <Save className="h-4 w-4" /> Save Stats
                </Button>
                <Button
                  variant="blue"
                  onClick={async () => {
                    setComputing(true);
                    const t = await auth.currentUser?.getIdToken();
                    await fetch("/api/standings/compute", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
                      body: JSON.stringify({ seasonId }),
                    });
                    setComputing(false);
                  }}
                  disabled={computing}
                >
                  <RefreshCw className={`h-4 w-4 ${computing ? "animate-spin" : ""}`} />
                  {computing ? "Computing..." : "Recalculate Standings"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
