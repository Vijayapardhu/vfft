"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTeamStandings, usePlayerStandings } from "@/hooks/useLeaderboard";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { toast } from "@/hooks/useToast";
import { auth } from "@/firebase/auth";
import { RefreshCw } from "lucide-react";

export default function AdminStandingsPage() {
  const { standings: teamStandings, loading: tl, error: te } = useTeamStandings();
  const { standings: playerStandings, loading: pl, error: pe } = usePlayerStandings();
  const { seasonId } = useActiveSeason();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRecalculate() {
    if (!seasonId) {
      toast({ type: "error", message: "No active season to recompute." });
      return;
    }
    setRefreshing(true);
    try {
      // Persist the season-stats cache (teamSeasonStats / playerSeasonStats)
      // read by player & team profile pages. The leaderboard itself derives
      // live from results, so it's always current.
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/standings/compute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ seasonId }),
      });
      if (!res.ok) throw new Error("Compute request failed");
      toast({ type: "success", message: "Standings recomputed." });
    } catch (e) {
      toast({ type: "error", message: e instanceof Error ? e.message : "Failed to recompute." });
    } finally {
      setRefreshing(false);
    }
  }

  const teamTab = {
    id: "teams",
    label: `Team Standings (${teamStandings.length})`,
    content: tl ? <Spinner /> : te ? <p className="font-bold text-vred">Failed to load standings.</p> : (
      <div className="overflow-x-auto rounded-3xl border-4 border-ink shadow-brutal-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-4 border-ink bg-vyellow">
              {["#", "Team", "MP", "W", "L", "Kills", "NDR", "Points"].map((h) => (
                <th key={h} className="px-4 py-3 text-sm font-bold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamStandings.map((s) => (
              <tr key={s.teamId} className="border-b-2 border-ink/10">
                <td className="px-4 py-3 text-sm font-bold">{s.rank}</td>
                <td className="flex items-center gap-2 px-4 py-3 text-sm font-bold">
                  {s.logoUrl && <img src={s.logoUrl} alt="" className="h-6 w-6 rounded-lg border border-ink object-cover" />}
                  {s.teamName}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{s.matchesPlayed}</td>
                <td className="px-4 py-3 text-sm font-medium text-vgreen">{s.wins}</td>
                <td className="px-4 py-3 text-sm font-medium text-vred">{s.losses}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.kills}</td>
                <td className="px-4 py-3 text-sm font-medium text-vpurple">{s.ndr}</td>
                <td className="px-4 py-3 text-lg font-bold">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };

  const playerTab = {
    id: "players",
    label: `Player Standings (${playerStandings.length})`,
    content: pl ? <Spinner /> : pe ? <p className="font-bold text-vred">Failed to load standings.</p> : (
      <div className="overflow-x-auto rounded-3xl border-4 border-ink shadow-brutal-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-4 border-ink bg-vyellow">
              {["#", "Player", "Team", "Kills", "Headshots", "Damage", "MVP"].map((h) => (
                <th key={h} className="px-4 py-3 text-sm font-bold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerStandings.map((s) => (
              <tr key={s.playerId} className="border-b-2 border-ink/10">
                <td className="px-4 py-3 text-sm font-bold">{s.rank}</td>
                <td className="flex items-center gap-2 px-4 py-3 text-sm font-bold">
                  {s.photoURL && <img src={s.photoURL} alt="" className="h-6 w-6 rounded-lg border border-ink object-cover" />}
                  {s.ign}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{s.teamName}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.kills}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.headshots}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.damage}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.mvpAwards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };

  return (
    <div>
      <AdminHeader
        title="Standings"
        subtitle="League standings & leaderboards"
        action={
          <Button variant="yellow" size="sm" onClick={handleRecalculate} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Recalculate
          </Button>
        }
      />
      <Tabs tabs={[teamTab, playerTab]} />
    </div>
  );
}
