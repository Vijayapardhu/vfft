"use client";

import { ArrowLeftRight, Coins, Skull, Swords, Trophy, Users } from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { MAX_SQUAD_SIZE, MAX_TRANSFERS_PER_SEASON } from "@/constants/app";
import { useTeamSeasonStats } from "@/hooks/useTeams";

export default function FranchiseOverviewPage() {
  const team = useFranchiseTeam();
  const { data: stats } = useTeamSeasonStats(team.id);
  const spent = (team.purse ?? 0) - (team.remainingPurse ?? 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <StatCard label="Points" value={stats?.points ?? 0} icon={Trophy} variant="yellow" />
      <StatCard label="Wins" value={stats?.wins ?? 0} icon={Swords} variant="green" />
      <StatCard label="Losses" value={stats?.losses ?? 0} variant="red" />
      <StatCard label="Kills" value={stats?.kills ?? 0} icon={Skull} variant="blue" />
      <StatCard
        label="Squad"
        value={`${team.squad?.length ?? 0}/${MAX_SQUAD_SIZE}`}
        icon={Users}
        variant="purple"
      />
      <StatCard
        label="Purse Left"
        value={(team.remainingPurse ?? 0).toLocaleString()}
        icon={Coins}
        variant="cream"
      />
      <StatCard label="Spent" value={spent.toLocaleString()} icon={Coins} variant="red" />
      <StatCard
        label="Transfers"
        value={`${team.transfersUsed ?? 0}/${MAX_TRANSFERS_PER_SEASON}`}
        icon={ArrowLeftRight}
        variant="blue"
      />
    </div>
  );
}
