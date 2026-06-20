"use client";

import { useState, useMemo, useEffect } from "react";
import { doc, getDoc, getDocs, query, setDoc, serverTimestamp, where } from "firebase/firestore";
import { COLLECTIONS, playerMatchStatsCol, resultsCol } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Spinner } from "@/components/ui/spinner";
import { useMatches, useMatchLineups } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { usePlayers } from "@/hooks/usePlayers";
import { Save, RefreshCw } from "lucide-react";
import { auth } from "@/firebase/auth";
import { toast } from "@/hooks/useToast";
import { advancePlayoffs, sendNotification } from "@/services/adminService";

interface PlayerStat {
  playerId: string;
  ign: string;
  kills: number;
  damage: number;
}

export default function AdminResultsPage() {
  const { data: matches, loading } = useMatches();
  const { data: teams } = useTeams();
  const { data: allPlayers } = usePlayers();
  const { seasonId } = useActiveSeason();
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [team1PP, setTeam1PP] = useState(0);
  const [team2PP, setTeam2PP] = useState(0);
  const [winner, setWinner] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);

  const [team1Players, setTeam1Players] = useState<PlayerStat[]>([]);
  const [team2Players, setTeam2Players] = useState<PlayerStat[]>([]);
  const [manualKills1, setManualKills1] = useState(0);
  const [manualKills2, setManualKills2] = useState(0);
  const [manualDamage1, setManualDamage1] = useState(0);
  const [manualDamage2, setManualDamage2] = useState(0);
  // Previously-saved per-player kills/damage, so editing a match shows current
  // values instead of resetting to zero.
  const [savedStats, setSavedStats] = useState<
    Record<string, { kills: number; damage: number }>
  >({});

  const completedOrLive = useMemo(
    () => matches.filter((m) => m.status === "completed" || m.status === "live"),
    [matches],
  );

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const team1 = teams.find((t) => t.id === selectedMatch?.team1Id);
  const team2 = teams.find((t) => t.id === selectedMatch?.team2Id);
  const { data: lineups } = useMatchLineups(selectedMatchId || null);

  // Reset state when match changes
  useEffect(() => {
    setTeam1Players([]);
    setTeam2Players([]);
    setTeam1PP(0);
    setTeam2PP(0);
    setWinner("");
    setEvidenceUrl("");
    setManualKills1(0);
    setManualKills2(0);
    setManualDamage1(0);
    setManualDamage2(0);
    setSavedStats({});
  }, [selectedMatchId]);

  // Load any PREVIOUSLY saved result for this match so it can be edited (not
  // overwritten with zeros). Reads fresh from Firestore on selection.
  useEffect(() => {
    if (!selectedMatchId) return;
    let cancelled = false;
    (async () => {
      const m = matches.find((x) => x.id === selectedMatchId);
      if (!m) return;
      const [resSnap, statSnap, evSnap] = await Promise.all([
        getDocs(query(resultsCol(), where("matchId", "==", selectedMatchId))),
        getDocs(query(playerMatchStatsCol(), where("matchId", "==", selectedMatchId))),
        getDoc(doc(db, COLLECTIONS.resultEvidence, selectedMatchId)),
      ]);
      if (cancelled) return;
      const results = resSnap.docs.map((d) => d.data());
      const r1 = results.find((r) => r.teamId === m.team1Id);
      const r2 = results.find((r) => r.teamId === m.team2Id);
      setTeam1PP(r1?.placementPoints ?? 0);
      setTeam2PP(r2?.placementPoints ?? 0);
      setManualKills1(r1?.kills ?? 0);
      setManualKills2(r2?.kills ?? 0);
      setManualDamage1(r1?.damage ?? 0);
      setManualDamage2(r2?.damage ?? 0);
      setWinner(
        r1?.outcome === "win" ? "team1" : r2?.outcome === "win" ? "team2" : "",
      );
      if (evSnap.exists()) {
        setEvidenceUrl((evSnap.data().screenshotUrl as string) ?? "");
      }
      const map: Record<string, { kills: number; damage: number }> = {};
      for (const s of statSnap.docs) {
        const d = s.data();
        if (typeof d.playerId === "string") {
          map[d.playerId] = { kills: d.kills ?? 0, damage: d.damage ?? 0 };
        }
      }
      setSavedStats(map);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId]);

  // Initialize per-player rows from the CONFIRMED match-day lineup (Playing 4)
  // when one exists, otherwise from the full squad. Preserves any kills/damage
  // already typed so a late-arriving lineup snapshot doesn't wipe input.
  useEffect(() => {
    if (!selectedMatch || !allPlayers.length || !team1 || !team2) return;

    const rosterFor = (team: typeof team1): string[] => {
      if (!team) return [];
      const lineup = lineups.find((l) => l.teamId === team.id);
      const ids =
        lineup && lineup.playingFour?.length ? lineup.playingFour : team.squad ?? [];
      return ids.filter((id) => allPlayers.find((p) => p.id === id));
    };
    const build = (ids: string[], prev: PlayerStat[]): PlayerStat[] =>
      ids.map((id) => {
        const p = allPlayers.find((pl) => pl.id === id);
        const old = prev.find((x) => x.playerId === id);
        const saved = savedStats[id];
        return {
          playerId: id,
          ign: p?.ign ?? "?",
          // Prefer already-typed values, then previously-saved, then 0.
          kills: old?.kills ?? saved?.kills ?? 0,
          damage: old?.damage ?? saved?.damage ?? 0,
        };
      });

    setTeam1Players((prev) => build(rosterFor(team1), prev));
    setTeam2Players((prev) => build(rosterFor(team2), prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatchId, lineups, savedStats]);

  // Auto-calculated totals
  const team1Kills = team1Players.length > 0
    ? team1Players.reduce((s, p) => s + p.kills, 0)
    : manualKills1;
  const team1Damage = team1Players.length > 0
    ? team1Players.reduce((s, p) => s + p.damage, 0)
    : manualDamage1;
  const team1NDR = team1Players.length > 0
    ? Math.round(team1Damage / Math.max(1, team1Players.length))
    : manualDamage1;

  const team2Kills = team2Players.length > 0
    ? team2Players.reduce((s, p) => s + p.kills, 0)
    : manualKills2;
  const team2Damage = team2Players.length > 0
    ? team2Players.reduce((s, p) => s + p.damage, 0)
    : manualDamage2;
  const team2NDR = team2Players.length > 0
    ? Math.round(team2Damage / Math.max(1, team2Players.length))
    : manualDamage2;

  function updatePlayerStat(
    team: "team1" | "team2",
    playerId: string,
    field: "kills" | "damage",
    value: number,
  ) {
    const setter = team === "team1" ? setTeam1Players : setTeam2Players;
    setter((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, [field]: Math.max(0, value) } : p)),
    );
  }

  async function handleSave() {
    if (!selectedMatchId || !seasonId || !evidenceUrl || !selectedMatch) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid ?? "admin";
      // Deterministic ids make every save idempotent — re-entering a result
      // overwrites the same docs instead of duplicating (which would
      // double-count the live standings).
      const evidenceId = selectedMatchId;
      await setDoc(
        doc(db, COLLECTIONS.resultEvidence, evidenceId),
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

      const team1Total = team1Kills + team1PP;
      const team2Total = team2Kills + team2PP;

      const results = [
        { teamId: selectedMatch.team1Id, kills: team1Kills, damage: team1Damage, placementPoints: team1PP, totalPoints: team1Total, outcome: (winner === "team1" ? "win" : "loss") as "win" | "loss" },
        { teamId: selectedMatch.team2Id, kills: team2Kills, damage: team2Damage, placementPoints: team2PP, totalPoints: team2Total, outcome: (winner === "team2" ? "win" : "loss") as "win" | "loss" },
      ];

      for (const r of results) {
        await setDoc(
          doc(db, COLLECTIONS.results, `${selectedMatchId}_${r.teamId}`),
          {
            seasonId,
            matchId: selectedMatchId,
            ...r,
            evidenceId,
            enteredBy: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      // Per-player kills/damage. Write every squad row so corrections (incl.
      // back to 0) persist; omit headshots/mvp so the dedicated Stats page can
      // own those fields via merge.
      const playerRows = [
        ...team1Players.map((p) => ({ ...p, teamId: selectedMatch.team1Id })),
        ...team2Players.map((p) => ({ ...p, teamId: selectedMatch.team2Id })),
      ];
      for (const ps of playerRows) {
        await setDoc(
          doc(db, COLLECTIONS.playerMatchStats, `${selectedMatchId}_${ps.playerId}`),
          {
            seasonId,
            matchId: selectedMatchId,
            playerId: ps.playerId,
            teamId: ps.teamId,
            kills: ps.kills,
            damage: ps.damage,
            evidenceId,
            enteredBy: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/standings/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ seasonId }),
      }).catch(() => {});
      // Auto-advance the playoff bracket if this was a Q1/Eliminator/Q2 result
      // (best-effort, non-blocking) — fills the next round's TBD slots.
      advancePlayoffs(seasonId).catch(() => {});
      // Announce updated results to everyone (best-effort, non-blocking).
      const label = selectedMatch.name || `Match #${selectedMatch.matchNumber}`;
      sendNotification({
        type: "resultsPublished",
        title: `Results published — ${label}`,
        body: "Standings have been updated.",
        href: `/matches/${selectedMatchId}`,
      }).catch(() => {});
      toast({ type: "success", message: "Result saved." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to save result." });
    } finally {
      setSaving(false);
    }
  }

  function renderPlayerSide(team: "team1" | "team2") {
    const players = team === "team1" ? team1Players : team2Players;
    const label = (team === "team1" ? team1?.name : team2?.name) ?? (team === "team1" ? "Team 1" : "Team 2");
    const hasSquad = players.length > 0;

    return (
      <div className="rounded-2xl border-4 border-ink p-4">
        <div className="mb-3 flex items-center gap-2">
          <img
            src={(team === "team1" ? team1?.logoUrl : team2?.logoUrl) || "/placeholder-team.svg"}
            alt={label}
            className="h-8 w-8 rounded-lg border-2 border-ink object-cover"
          />
          <span className="font-bold">{label}</span>
        </div>

        {hasSquad ? (
          players.map((ps) => (
            <div key={ps.playerId} className="mb-2 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{ps.ign}</span>
              <div className="flex items-center gap-1">
                <Label className="mb-0 text-[10px]">K</Label>
                <input
                  type="number"
                  min={0}
                  value={ps.kills}
                  onChange={(e) => updatePlayerStat(team, ps.playerId, "kills", Number(e.target.value))}
                  className="w-14 rounded-lg border-2 border-ink bg-cream px-2 py-1 text-xs font-bold text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="mb-0 text-[10px]">DMG</Label>
                <input
                  type="number"
                  min={0}
                  value={ps.damage}
                  onChange={(e) => updatePlayerStat(team, ps.playerId, "damage", Number(e.target.value))}
                  className="w-16 rounded-lg border-2 border-ink bg-cream px-2 py-1 text-xs font-bold text-center"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            <p className="mb-2 text-sm font-medium text-ink/40">No squad members — enter totals manually:</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Kills</Label>
                <Input
                  type="number"
                  min={0}
                  value={team === "team1" ? manualKills1 : manualKills2}
                  onChange={(e) =>
                    team === "team1"
                      ? setManualKills1(Number(e.target.value))
                      : setManualKills2(Number(e.target.value))
                  }
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">DMG</Label>
                <Input
                  type="number"
                  min={0}
                  value={team === "team1" ? manualDamage1 : manualDamage2}
                  onChange={(e) =>
                    team === "team1"
                      ? setManualDamage1(Number(e.target.value))
                      : setManualDamage2(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 space-y-3 border-t-2 border-ink/10 pt-3">
          <div>
            <Label>Placement Points</Label>
            <Input
              type="number"
              min={0}
              value={team === "team1" ? team1PP : team2PP}
              onChange={(e) =>
                team === "team1"
                  ? setTeam1PP(Number(e.target.value))
                  : setTeam2PP(Number(e.target.value))
              }
            />
          </div>

          <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
            <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
              <div>
                <span className="text-xs text-ink/40">Kills</span>
                <p className="text-lg">{team === "team1" ? team1Kills : team2Kills}</p>
              </div>
              <div>
                <span className="text-xs text-ink/40">Total DMG</span>
                <p className="text-lg">{team === "team1" ? team1Damage : team2Damage}</p>
              </div>
              <div>
                <span className="text-xs text-ink/40">NDR</span>
                <p className="text-lg text-vpurple">{team === "team1" ? team1NDR : team2NDR}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Results" subtitle="Enter match results & player stats" />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Result Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Match</Label>
            <Select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
              <option value="">Choose completed/live match</option>
              {completedOrLive.map((m) => (
                <option key={m.id} value={m.id}>
                  Match #{m.matchNumber} — {teams.find((t) => t.id === m.team1Id)?.name} vs {teams.find((t) => t.id === m.team2Id)?.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedMatch && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderPlayerSide("team1")}
                {renderPlayerSide("team2")}
              </div>

              <div>
                <Label>Winner</Label>
                <Select value={winner} onChange={(e) => setWinner(e.target.value)}>
                  <option value="">Select winner</option>
                  <option value="team1">{team1?.name}</option>
                  <option value="team2">{team2?.name}</option>
                </Select>
              </div>

              <div>
                <Label>Screenshot Evidence</Label>
                <ImageUploader value={evidenceUrl} onChange={setEvidenceUrl} folder="match-evidence" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="yellow" onClick={handleSave} disabled={!evidenceUrl || !winner || saving}>
                  <Save className="h-4 w-4" /> Save Result
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
