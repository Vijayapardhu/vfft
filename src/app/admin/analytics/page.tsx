"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { useTeams } from "@/hooks/useTeams";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { usePlayerStandings, useTeamStandings } from "@/hooks/useLeaderboard";
import {
  Coins,
  Crosshair,
  Gavel,
  Shield,
  Swords,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  rusher: "Rusher",
  sniper: "Sniper",
  support: "Support",
  igl: "IGL",
};

function toMillis(value: unknown): number {
  return (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
}

export default function AdminAnalyticsPage() {
  const { data: teams, loading: tLoading } = useTeams();
  const { data: players, loading: pLoading } = usePlayers();
  const { data: matches, loading: mLoading } = useMatches();
  const { standings: teamStandings } = useTeamStandings();
  const { standings: playerStandings } = usePlayerStandings();

  // --- Headline aggregates ---
  const approved = useMemo(() => players.filter((p) => p.status === "approved"), [players]);
  const signed = useMemo(() => players.filter((p) => p.teamId), [players]);
  const freeAgents = useMemo(() => approved.filter((p) => !p.teamId).length, [approved]);
  const totalKills = useMemo(
    () => teamStandings.reduce((s, t) => s + (t.kills ?? 0), 0),
    [teamStandings],
  );
  const coinsSpent = useMemo(
    () => teams.reduce((s, t) => s + Math.max(0, (t.purse ?? 0) - (t.remainingPurse ?? 0)), 0),
    [teams],
  );
  const coinsLeft = useMemo(
    () => teams.reduce((s, t) => s + (t.remainingPurse ?? 0), 0),
    [teams],
  );
  const avgSale = useMemo(() => {
    const sales = signed.map((p) => p.soldPrice ?? 0).filter((v) => v > 0);
    return sales.length ? Math.round(sales.reduce((a, b) => a + b, 0) / sales.length) : 0;
  }, [signed]);

  // --- Distributions ---
  const playersByStatus = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, suspended: 0 } as Record<string, number>;
    for (const p of players) c[p.status] = (c[p.status] ?? 0) + 1;
    return [
      { name: "Pending", value: c.pending ?? 0, fill: "#FFD93D" },
      { name: "Approved", value: c.approved ?? 0, fill: "#22C55E" },
      { name: "Rejected", value: c.rejected ?? 0, fill: "#FF6B6B" },
      { name: "Suspended", value: c.suspended ?? 0, fill: "#A855F7" },
    ];
  }, [players]);

  const playersByRole = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of players) c[p.role] = (c[p.role] ?? 0) + 1;
    return Object.entries(ROLE_LABELS).map(([key, name]) => ({ name, value: c[key] ?? 0, fill: "#3B82F6" }));
  }, [players]);

  const playersByDevice = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of players) {
      const d = (p.device || "Unknown").trim() || "Unknown";
      c[d] = (c[d] ?? 0) + 1;
    }
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, fill: "#A855F7" }));
  }, [players]);

  const matchesByStatus = useMemo(() => {
    const c = { upcoming: 0, live: 0, completed: 0 } as Record<string, number>;
    for (const m of matches) c[m.status] = (c[m.status] ?? 0) + 1;
    return [
      { name: "Upcoming", value: c.upcoming ?? 0, fill: "#FFD93D" },
      { name: "Live", value: c.live ?? 0, fill: "#FF6B6B" },
      { name: "Completed", value: c.completed ?? 0, fill: "#22C55E" },
    ];
  }, [matches]);

  const auctionSplit = useMemo(
    () => [
      { name: "Signed", value: signed.length, fill: "#22C55E" },
      { name: "Free Agents", value: freeAgents, fill: "#FFD93D" },
      { name: "Unapproved", value: players.length - approved.length, fill: "#FF6B6B" },
    ],
    [signed.length, freeAgents, players.length, approved.length],
  );

  const spendByTeam = useMemo(
    () =>
      teams
        .map((t) => ({ name: t.name, value: Math.max(0, (t.purse ?? 0) - (t.remainingPurse ?? 0)), fill: "#A855F7" }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [teams],
  );

  const squadFill = useMemo(
    () => teams.map((t) => ({ name: t.name, value: t.squad?.length ?? 0, fill: "#3B82F6" })).slice(0, 10),
    [teams],
  );

  const topTeams = useMemo(
    () => teamStandings.slice(0, 8).map((t) => ({ name: t.teamName, value: t.points ?? 0, fill: "#22C55E" })),
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

  const topSales = useMemo(
    () =>
      [...signed]
        .filter((p) => (p.soldPrice ?? 0) > 0)
        .sort((a, b) => (b.soldPrice ?? 0) - (a.soldPrice ?? 0))
        .slice(0, 8)
        .map((p) => ({ name: p.ign, value: p.soldPrice ?? 0, fill: "#FFD93D" })),
    [signed],
  );

  // Registrations per day (from player.createdAt).
  const registrations = useMemo(() => {
    const byDay = new Map<number, { label: string; count: number }>();
    for (const p of players) {
      const ms = toMillis((p as unknown as { createdAt?: unknown }).createdAt);
      if (!ms) continue;
      const d = new Date(ms);
      const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const cur = byDay.get(key);
      if (cur) cur.count += 1;
      else byDay.set(key, { label, count: 1 });
    }
    return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => ({ name: v.label, value: v.count }));
  }, [players]);

  const squadFillPct = teams.length
    ? Math.round((teams.reduce((s, t) => s + (t.squad?.length ?? 0), 0) / (teams.length * MAX_SQUAD_SIZE)) * 100)
    : 0;

  const summaryCards = [
    { label: "Teams", value: teams.length, icon: Shield, color: "bg-vpurple" },
    { label: "Players", value: players.length, icon: Users, color: "bg-vblue" },
    { label: "Approved", value: approved.length, icon: UserCheck, color: "bg-vgreen" },
    { label: "Free Agents", value: freeAgents, icon: Gavel, color: "bg-vyellow" },
    { label: "Signed", value: signed.length, icon: UserCheck, color: "bg-vgreen" },
    { label: "Matches", value: matches.length, icon: Swords, color: "bg-vblue" },
    { label: "Total Kills", value: totalKills.toLocaleString(), icon: Crosshair, color: "bg-vred" },
    { label: "Coins Spent", value: coinsSpent.toLocaleString(), icon: Coins, color: "bg-vyellow" },
    { label: "Coins Left", value: coinsLeft.toLocaleString(), icon: Coins, color: "bg-vgreen" },
    { label: "Avg. Sale", value: avgSale.toLocaleString(), icon: TrendingUp, color: "bg-vpurple" },
    { label: "Squad Fill", value: `${squadFillPct}%`, icon: Shield, color: "bg-vblue" },
    { label: "Rosters Full", value: teams.filter((t) => (t.squad?.length ?? 0) >= MAX_SQUAD_SIZE).length, icon: Shield, color: "bg-vred" },
  ];

  if (tLoading || pLoading || mLoading) return <Spinner />;

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Live platform metrics & player performance" />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 truncate text-xs font-bold uppercase tracking-wide text-ink/60">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registrations trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Player Registrations Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrations}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fill="url(#regGrad)" name="Registrations" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm font-medium text-ink/40">No registrations yet.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Players by Status" data={playersByStatus} />
        <ChartCard title="Players by Role" data={playersByRole} />
        <ChartCard title="Auction Pool" data={auctionSplit} />
        <ChartCard title="Players by Device" data={playersByDevice} />
        <ChartCard title="Spend by Team" data={spendByTeam} />
        <ChartCard title="Squad Size by Team" data={squadFill} />
        <ChartCard title="Top Sales (Coins)" data={topSales} />
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
          <div className="grid h-full place-items-center text-sm font-medium text-ink/40">No data yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
