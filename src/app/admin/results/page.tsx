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
import { advancePlayoffs, sendNotification, setMatchLiveState } from "@/services/adminService";

interface PlayerStat {
  playerId: string;
  ign: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshotRate: number; // percent 0-100
  knockdowns: number;
}

/** Numeric stat fields the admin types per player. */
type StatField = "kills" | "deaths" | "assists" | "damage" | "headshotRate" | "knockdowns";

const STAT_FIELDS: { key: StatField; label: string; w: string }[] = [
  { key: "kills", label: "K", w: "w-12" },
  { key: "deaths", label: "D", w: "w-12" },
  { key: "assists", label: "A", w: "w-12" },
  { key: "damage", label: "DMG", w: "w-16" },
  { key: "headshotRate", label: "HS%", w: "w-14" },
  { key: "knockdowns", label: "KO", w: "w-12" },
];

interface SavedStat {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshotRate: number;
  knockdowns: number;
}

export default function AdminResultsPage() {
  const { data: matches, loading } = useMatches();
  const { data: teams } = useTeams();
  const { data: allPlayers } = usePlayers();
  const { seasonId } = useActiveSeason();
  const [selectedMatchId, setSelectedMatchId] = useState("");
  // Clash-Squad round score for each team (e.g. 4–1). The winner is whoever
  // won more rounds; round difference is the primary standings tiebreaker.
  const [team1Rounds, setTeam1Rounds] = useState(0);
  const [team2Rounds, setTeam2Rounds] = useState(0);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  // A second, reference-only screenshot (e.g. the enemy team's stat screen) so
  // both teams' numbers are visible while typing. Not saved as evidence.
  const [refUrl2, setRefUrl2] = useState("");
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
  const [savedStats, setSavedStats] = useState<Record<string, SavedStat>>({});

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
    setTeam1Rounds(0);
    setTeam2Rounds(0);
    setEvidenceUrl("");
    setRefUrl2("");
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
      setTeam1Rounds(r1?.roundsWon ?? 0);
      setTeam2Rounds(r2?.roundsWon ?? 0);
      setManualKills1(r1?.kills ?? 0);
      setManualKills2(r2?.kills ?? 0);
      setManualDamage1(r1?.damage ?? 0);
      setManualDamage2(r2?.damage ?? 0);
      if (evSnap.exists()) {
        setEvidenceUrl((evSnap.data().screenshotUrl as string) ?? "");
      }
      const map: Record<string, SavedStat> = {};
      for (const s of statSnap.docs) {
        const d = s.data();
        if (typeof d.playerId === "string") {
          map[d.playerId] = {
            kills: d.kills ?? 0,
            deaths: d.deaths ?? 0,
            assists: d.assists ?? 0,
            damage: d.damage ?? 0,
            headshotRate: d.headshotRate ?? 0,
            knockdowns: d.knockdowns ?? 0,
          };
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
        const pick = (field: StatField) => old?.[field] ?? saved?.[field] ?? 0;
        return {
          playerId: id,
          ign: p?.ign ?? "?",
          // Prefer already-typed values, then previously-saved, then 0.
          kills: pick("kills"),
          deaths: pick("deaths"),
          assists: pick("assists"),
          damage: pick("damage"),
          headshotRate: pick("headshotRate"),
          knockdowns: pick("knockdowns"),
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

  const team2Kills = team2Players.length > 0
    ? team2Players.reduce((s, p) => s + p.kills, 0)
    : manualKills2;
  const team2Damage = team2Players.length > 0
    ? team2Players.reduce((s, p) => s + p.damage, 0)
    : manualDamage2;

  // Winner is derived from the round score (e.g. 4–1). "" when tied/unset.
  const winner: "" | "team1" | "team2" =
    team1Rounds > team2Rounds ? "team1" : team2Rounds > team1Rounds ? "team2" : "";

  function updatePlayerStat(
    team: "team1" | "team2",
    playerId: string,
    field: StatField,
    value: number,
  ) {
    const cap = field === "headshotRate" ? 100 : Infinity;
    const clean = Math.min(cap, Math.max(0, Number.isFinite(value) ? value : 0));
    const setter = team === "team1" ? setTeam1Players : setTeam2Players;
    setter((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, [field]: clean } : p)),
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

      // Points are win-based (1 per win); round difference + damage are the
      // tiebreakers (computed in standings). Store each team's round score and
      // the opponent's so the standings can total round difference.
      const results = [
        { teamId: selectedMatch.team1Id, kills: team1Kills, damage: team1Damage, roundsWon: team1Rounds, roundsLost: team2Rounds, totalPoints: winner === "team1" ? 1 : 0, outcome: (winner === "team1" ? "win" : "loss") as "win" | "loss" },
        { teamId: selectedMatch.team2Id, kills: team2Kills, damage: team2Damage, roundsWon: team2Rounds, roundsLost: team1Rounds, totalPoints: winner === "team2" ? 1 : 0, outcome: (winner === "team2" ? "win" : "loss") as "win" | "loss" },
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
            deaths: ps.deaths,
            assists: ps.assists,
            damage: ps.damage,
            headshotRate: ps.headshotRate,
            knockdowns: ps.knockdowns,
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
      // Submitting a result means the match is over — mark it completed so the
      // admin doesn't have to flip the status separately.
      try {
        if (selectedMatch.status !== "completed") {
          await setMatchLiveState(selectedMatchId, "completed");
        }
      } catch {
        /* result still saved; status flip can be retried from Matches */
      }
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
      toast({ type: "success", message: "Result saved — match marked completed." });
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
          <>
            <div className="mb-2 hidden grid-cols-[1fr_auto] items-center gap-2 sm:grid">
              <span />
              <div className="flex gap-2">
                {STAT_FIELDS.map((f) => (
                  <span key={f.key} className={`${f.w} text-center text-[9px] font-bold uppercase text-ink/40`}>{f.label}</span>
                ))}
              </div>
            </div>
            {players.map((ps) => (
              <div key={ps.playerId} className="mb-2 rounded-xl border-2 border-ink/15 p-2">
                <p className="mb-1 truncate text-sm font-bold">{ps.ign}</p>
                <div className="flex flex-wrap gap-2">
                  {STAT_FIELDS.map((f) => (
                    <div key={f.key} className="flex flex-col items-center">
                      <Label className="mb-0 text-[9px] uppercase text-ink/50 sm:hidden">{f.label}</Label>
                      <input
                        type="number"
                        min={0}
                        max={f.key === "headshotRate" ? 100 : undefined}
                        value={ps[f.key]}
                        onChange={(e) => updatePlayerStat(team, ps.playerId, f.key, Number(e.target.value))}
                        className={`${f.w} rounded-lg border-2 border-ink bg-cream px-1 py-1 text-xs font-bold text-center`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
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
            <Label>Rounds Won (this team&apos;s score, e.g. 4)</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={team === "team1" ? team1Rounds : team2Rounds}
              onChange={(e) =>
                team === "team1"
                  ? setTeam1Rounds(Math.max(0, Number(e.target.value)))
                  : setTeam2Rounds(Math.max(0, Number(e.target.value)))
              }
            />
          </div>

          <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
            <div className="grid grid-cols-4 gap-2 text-center text-sm font-bold">
              <div>
                <span className="text-xs text-ink/40">Rounds</span>
                <p className={`text-lg ${winner === team ? "text-vgreen" : ""}`}>
                  {team === "team1" ? team1Rounds : team2Rounds}
                </p>
              </div>
              <div>
                <span className="text-xs text-ink/40">Kills</span>
                <p className="text-lg">{team === "team1" ? team1Kills : team2Kills}</p>
              </div>
              <div>
                <span className="text-xs text-ink/40">DMG</span>
                <p className="text-lg">{team === "team1" ? team1Damage : team2Damage}</p>
              </div>
              <div>
                <span className="text-xs text-ink/40">Result</span>
                <p className={`text-lg ${winner === team ? "text-vgreen" : winner ? "text-vred" : "text-ink/30"}`}>
                  {winner === team ? "WIN" : winner ? "LOSS" : "—"}
                </p>
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

      <Card className="max-w-5xl">
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
              {/* Upload the scoreboard(s) first, then read each player's row
                  while typing the stats below. */}
              <div className="space-y-3 rounded-2xl border-4 border-ink bg-vyellow/10 p-3">
                <p className="text-sm font-bold">
                  📸 Upload the post-match scoreboard, then read each player&apos;s
                  K/D/A · DMG · HS% · KO from it as you fill the rows below.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Scoreboard screenshot (saved as evidence)</Label>
                    <ImageUploader value={evidenceUrl} onChange={setEvidenceUrl} folder="match-evidence" />
                  </div>
                  <div>
                    <Label>Second screenshot (reference only — e.g. enemy team)</Label>
                    <ImageUploader value={refUrl2} onChange={setRefUrl2} folder="match-evidence" />
                  </div>
                </div>
                {(evidenceUrl || refUrl2) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {evidenceUrl && <ScreenshotRef url={evidenceUrl} label="Evidence" />}
                    {refUrl2 && <ScreenshotRef url={refUrl2} label="Reference" />}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {renderPlayerSide("team1")}
                {renderPlayerSide("team2")}
              </div>

              <div className="rounded-2xl border-4 border-ink bg-cream p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50">Result</p>
                <p className="mt-1 text-2xl font-bold">
                  <span className={winner === "team1" ? "text-vgreen" : ""}>{team1?.name ?? "Team 1"}</span>
                  {"  "}
                  <span className="text-ink/40">{team1Rounds} – {team2Rounds}</span>
                  {"  "}
                  <span className={winner === "team2" ? "text-vgreen" : ""}>{team2?.name ?? "Team 2"}</span>
                </p>
                <p className="mt-1 text-sm font-bold">
                  {winner
                    ? `Winner: ${(winner === "team1" ? team1?.name : team2?.name) ?? "—"} (1 pt)`
                    : "Enter each team's rounds — the winner is the higher score."}
                </p>
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

/** Large, readable preview of a scoreboard screenshot with a full-size link. */
function ScreenshotRef({ url, label }: { url: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-ink">
      <div className="flex items-center justify-between bg-ink px-3 py-1.5">
        <span className="text-xs font-bold uppercase text-cream">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-vyellow hover:underline"
        >
          Open full size ↗
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="max-h-96 w-full bg-cream object-contain" />
    </div>
  );
}
