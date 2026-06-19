"use client";

import { useState } from "react";
import { Users, Crown, Shield, Star } from "lucide-react";
import { useFranchiseTeam } from "@/components/franchise/FranchiseShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useTeamPlayers } from "@/hooks/usePlayers";
import { PLAYING_SQUAD_SIZE, MAX_SQUAD_SIZE } from "@/constants/app";
import { cn } from "@/lib/utils";
import type { Player, WithId } from "@/types";

const ROLE_COLORS: Record<string, string> = {
  rusher: "bg-vred/20 text-vred",
  sniper: "bg-vpurple/20 text-vpurple",
  support: "bg-vgreen/20 text-vgreen",
  igl: "bg-vyellow/20 text-ink",
};

function PlayerTile({ player, isLeader }: { player: WithId<Player>; isLeader: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border-4 border-ink bg-cream shadow-brutal-xs transition-transform hover:-translate-y-0.5">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-vpurple/20">
        {player.photoURL ? (
          <img src={player.photoURL} alt={player.ign} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <Users className="h-10 w-10 text-ink/20" />
          </div>
        )}
        {isLeader && (
          <div className="absolute left-2 top-2 rounded-lg border-2 border-ink bg-vyellow px-1.5 py-0.5">
            <Crown className="h-3 w-3" />
          </div>
        )}
        {player.soldPrice !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-ink/70 px-2 py-1 text-center">
            <p className="text-xs font-bold text-cream">{player.soldPrice.toLocaleString()} coins</p>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="truncate font-bold">{player.ign}</p>
        <span className={cn("mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold uppercase", ROLE_COLORS[player.role ?? ""] ?? "bg-ink/10")}>
          {player.role ?? "player"}
        </span>
      </div>
    </div>
  );
}

export default function FranchiseSquadPage() {
  const team = useFranchiseTeam();
  const { data: players, loading } = useTeamPlayers(team.id);
  const [tab, setTab] = useState("main");

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border-4 border-ink/20 bg-cream/50 aspect-[3/4]" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return <EmptyState icon={Users} title="Squad is empty" message="Players join through the auction." />;
  }

  const sorted = [...players].sort((a, b) => a.ign.localeCompare(b.ign));
  const mainSquad = sorted.slice(0, PLAYING_SQUAD_SIZE);
  const bench = sorted.slice(PLAYING_SQUAD_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Squad</h1>
        <Badge variant="purple">
          {players.length}/{MAX_SQUAD_SIZE} players
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {[
          { id: "main", label: `Main Squad (${Math.min(players.length, PLAYING_SQUAD_SIZE)})` },
          { id: "bench", label: `Bench (${Math.max(0, players.length - PLAYING_SQUAD_SIZE)})` },
          { id: "all", label: "All Players" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-9 rounded-xl border-2 border-ink px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
              tab === t.id ? "bg-ink text-cream" : "bg-cream hover:bg-vyellow",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "main" && (
        mainSquad.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {mainSquad.map((p) => (
              <PlayerTile key={p.id} player={p} isLeader={team.teamLeaderUid === p.uid} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Star} title="No main squad yet" message="Snap up players in the auction to fill your starting lineup." />
        )
      )}

      {tab === "bench" && (
        bench.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {bench.map((p) => (
              <PlayerTile key={p.id} player={p} isLeader={false} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Shield} title="No bench players" message="Win the auction for more players to fill your bench." />
        )
      )}

      {tab === "all" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((p) => (
            <PlayerTile key={p.id} player={p} isLeader={team.teamLeaderUid === p.uid} />
          ))}
        </div>
      )}
    </div>
  );
}
