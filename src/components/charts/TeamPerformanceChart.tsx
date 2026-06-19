"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND_COLORS } from "@/constants/colors";
import { useMatches } from "@/hooks/useMatches";
import { useTeamResults } from "@/hooks/useTeams";

/** Per-match Points + Kills bar chart for a team (UID §10/§23). */
export function TeamPerformanceChart({ teamId }: { teamId: string }) {
  const { data: results } = useTeamResults(teamId);
  const { data: matches } = useMatches();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // Recharts is client-only

  const data = useMemo(() => {
    const numberOf = (matchId: string) =>
      matches.find((m) => m.id === matchId)?.matchNumber ?? 0;
    return results
      .slice()
      .sort((a, b) => numberOf(a.matchId) - numberOf(b.matchId))
      .map((r) => ({
        name: `M${numberOf(r.matchId) || "?"}`,
        Points: r.totalPoints ?? 0,
        Kills: r.kills ?? 0,
      }));
  }, [results, matches]);

  if (!mounted) {
    return <div className="h-64 rounded-3xl border-4 border-ink bg-cream shadow-brutal" />;
  }
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border-4 border-dashed border-ink/30 p-8 text-center font-medium text-ink/50">
        Performance charts appear once results are recorded.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-4 border-ink bg-cream p-4 shadow-brutal">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                border: "3px solid #000",
                borderRadius: 12,
                fontWeight: 700,
              }}
            />
            <Legend />
            <Bar dataKey="Points" fill={BRAND_COLORS.yellow} stroke="#000" strokeWidth={2} radius={[6, 6, 0, 0]} />
            <Bar dataKey="Kills" fill={BRAND_COLORS.red} stroke="#000" strokeWidth={2} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
