"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { usePlayerStandings, useTeamStandings } from "@/hooks/useLeaderboard";
import { Coins, Crosshair, Swords, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  rusher: "Rusher",
  sniper: "Sniper",
  support: "Support",
  igl: "IGL",
};

export default function AdminAnalyticsPage() {
  const { data: teams, loading: tLoading } = useTeams();
  const { data: players, loading: pLoading } = usePlayers();
  const { data: matches, loading: mLoading } = useMatches();
  const { standings: teamStandings } = useTeamStandings();
  const { standings: playerStandings } = usePlayerStandings();

  // --- Real aggregates derived from live Firestore data ---
  const totalKills = useMemo(
    () => teamStandings.reduce((s, t) => s + (t.kills ?? 0), 0),
    [teamStandings],
  );
  const coinsSpent = useMemo(
    () =>
      teams.reduce(
        (s, t) => s + Math.max(0, (t.purse ?? 0) - (t.remainingPurse ?? 0)),
        0,
      ),
    [teams],
  );

  const playersByStatus = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, suspended: 0 } as Record<string, number>;
    for (const p of players) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return [
      { name: "Pending", value: counts.pending ?? 0, fill: "#FFD93D" },
      { name: "Approved", value: counts.approved ?? 0, fill: "#22C55E" },
      { name: "Rejected", value: counts.rejected ?? 0, fill: "#FF6B6B" },
      { name: "Suspended", value: counts.suspended ?? 0, fill: "#A855F7" },
    ];
  }, [players]);

  const playersByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of players) counts[p.role] = (counts[p.role] ?? 0) + 1;
    return Object.entries(ROLE_LABELS).map(([key, name]) => ({
      name,
      value: counts[key] ?? 0,
      fill: "#3B82F6",
    }));
  }, [players]);

  const matchesByStatus = useMemo(() => {
    const counts = { upcoming: 0, live: 0, completed: 0 } as Record<string, number>;
    for (const m of matches) counts[m.status] = (counts[m.status] ?? 0) + 1;
    return [
      { name: "Upcoming", value: counts.upcoming ?? 0, fill: "#FFD93D" },
      { name: "Live", value: counts.live ?? 0, fill: "#FF6B6B" },
      { name: "Completed", value: counts.completed ?? 0, fill: "#22C55E" },
    ];
  }, [matches]);

  const topTeams = useMemo(
    () =>
      teamStandings
        .slice(0, 8)
        .map((t) => ({ name: t.teamName, value: t.points ?? 0, fill: "#22C55E" })),
    [teamStandings],
  );

  const topPlayers = useMemo(
    () =>
      [...playerStandings]
        .sort((a, b) => b.kills - a.kills)
        .slice(0, 8)
        .map((p) => ({ name: p.ign, value: p.kills ?? 0, fill: "#FF6B6B" })),
    [playerStandings],
  );

  const summaryCards = [
    { label: "Players", value: players.length, icon: Users, color: "bg-vblue" },
    { label: "Matches", value: matches.length, icon: Swords, color: "bg-vgreen" },
    { label: "Total Kills", value: totalKills, icon: Crosshair, color: "bg-vred" },
    { label: "Coins Spent", value: coinsSpent.toLocaleString(), icon: Coins, color: "bg-vyellow" },
  ];

  if (tLoading || pLoading || mLoading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Live platform metrics" />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Players by Status" data={playersByStatus} />
        <ChartCard title="Players by Role" data={playersByRole} />
        <ChartCard title="Matches by Status" data={matchesByStatus} />
        <ChartCard title="Top Teams (Points)" data={topTeams} />
        <ChartCard title="Top Players (Kills)" data={topPlayers} />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; fill: string }[];
}) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" stroke="#000" strokeWidth={2} radius={[8, 8, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-sm font-medium text-ink/40">
            No data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
