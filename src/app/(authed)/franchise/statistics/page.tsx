"use client";

import { Skull, Swords, Trophy } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { TeamPerformanceChart } from "@/components/charts/TeamPerformanceChart";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { useTeamSeasonStats } from "@/hooks/useTeams";

export default function FranchiseStatisticsPage() {
  const team = useFranchiseTeam();
  const { data: stats } = useTeamSeasonStats(team.id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Matches" value={stats?.matchesPlayed ?? 0} icon={Swords} variant="blue" />
        <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="red" />
        <StatCard label="Points" value={stats?.points ?? 0} icon={Trophy} variant="yellow" />
      </div>
      <TeamPerformanceChart teamId={team.id} />
    </div>
  );
}
