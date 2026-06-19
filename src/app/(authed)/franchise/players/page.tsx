"use client";

import { Users } from "lucide-react";
import { PlayerCard, PlayerCardSkeleton } from "@/components/cards/PlayerCard";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { EmptyState } from "@/components/ui/empty-state";
import { useTeamPlayers } from "@/hooks/usePlayers";

export default function FranchiseSquadPage() {
  const team = useFranchiseTeam();
  const { data: players, loading } = useTeamPlayers(team.id);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (players.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No players yet"
        message="Your squad fills up through the auction."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {players
        .slice()
        .sort((a, b) => a.ign.localeCompare(b.ign))
        .map((p) => (
          <PlayerCard key={p.id} player={p} />
        ))}
    </div>
  );
}
