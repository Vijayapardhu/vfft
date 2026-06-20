"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ExternalLink,
  Eye,
  RefreshCw,
  Timer,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/firebase/auth";

interface GaReport {
  configured: boolean;
  reason?: string;
  days?: number;
  totals?: {
    activeUsers: number;
    newUsers: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
  };
  series?: { date: string; users: number; views: number }[];
  topPages?: { path: string; views: number }[];
  devices?: { name: string; users: number }[];
}

const RANGES = [7, 28, 90];

function fmtDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function GoogleAnalyticsPanel() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<GaReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(range: number) {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/analytics/ga", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ days: range }),
      });
      setData((await res.json()) as GaReport);
    } catch {
      setData({ configured: false, reason: "Could not reach the analytics service." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(days);
  }, [days]);

  const header = (
    <div className="mb-4 mt-10 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Google Analytics</h2>
        <p className="text-sm font-medium text-ink/50">Live website traffic (GA4)</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border-2 border-ink">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`px-3 py-1.5 text-xs font-bold ${days === r ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow/40"}`}
            >
              {r}d
            </button>
          ))}
        </div>
        <Button variant="cream" size="sm" onClick={() => load(days)} disabled={loading}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );

  if (loading && !data) {
    return (
      <>
        {header}
        <Spinner />
      </>
    );
  }

  // Not connected → setup guidance.
  if (!data?.configured) {
    return (
      <>
        {header}
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="font-bold">📊 Connect Google Analytics to see live traffic here.</p>
            {data?.reason && (
              <p className="rounded-xl border-2 border-ink/15 bg-vyellow/15 px-3 py-2 text-sm font-medium">
                {data.reason}
              </p>
            )}
            <ol className="ml-5 list-decimal space-y-1 text-sm font-medium text-ink/70">
              <li>In Google Cloud, enable the <strong>Google Analytics Data API</strong>.</li>
              <li>
                In GA4 → Admin → Property Access Management, add your Firebase
                service-account email as a <strong>Viewer</strong>.
              </li>
              <li>
                Set <code className="rounded bg-ink/10 px-1">GA4_PROPERTY_ID</code> (the numeric
                property id from GA4 → Admin → Property details) in your hosting env, then redeploy.
              </li>
            </ol>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold text-vblue hover:underline"
            >
              Open Google Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </>
    );
  }

  const t = data.totals!;
  const cards = [
    { label: "Active Users", value: t.activeUsers.toLocaleString(), icon: Users, color: "bg-vblue" },
    { label: "New Users", value: t.newUsers.toLocaleString(), icon: UserPlus, color: "bg-vgreen" },
    { label: "Sessions", value: t.sessions.toLocaleString(), icon: Activity, color: "bg-vpurple" },
    { label: "Page Views", value: t.pageViews.toLocaleString(), icon: Eye, color: "bg-vred" },
    { label: "Avg. Session", value: fmtDuration(t.avgSessionDuration), icon: Timer, color: "bg-vyellow" },
  ];

  return (
    <>
      {header}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="mb-1 truncate text-xs font-bold uppercase tracking-wide text-ink/60">{c.label}</p>
                  <p className="text-2xl font-bold">{c.value}</p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users &amp; Page Views ({data.days}d)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {data.series && data.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series}>
                  <defs>
                    <linearGradient id="gaUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gaViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} fill="url(#gaUsers)" name="Users" />
                  <Area type="monotone" dataKey="views" stroke="#22C55E" strokeWidth={2} fill="url(#gaViews)" name="Views" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm font-medium text-ink/40">No traffic yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topPages && data.topPages.length > 0 ? (
              <div className="divide-y-2 divide-ink/10">
                {data.topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <span className="min-w-0 truncate text-sm font-bold">{p.path || "/"}</span>
                    <span className="shrink-0 rounded-lg border-2 border-ink bg-vyellow px-2 py-0.5 text-xs font-bold">
                      {p.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-40 place-items-center text-sm font-medium text-ink/40">No pages yet.</div>
            )}
            {data.devices && data.devices.length > 0 && (
              <div className="border-t-4 border-ink p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/50">Devices</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.devices.map((d, i) => (
                    <span key={i} className="rounded-lg border-2 border-ink bg-cream px-2 py-0.5 text-xs font-bold capitalize">
                      {d.name}: {d.users.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
