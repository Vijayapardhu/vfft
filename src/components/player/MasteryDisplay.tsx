"use client";

import { ChevronDown, ChevronUp, Crosshair, Swords, Trophy, Star, Skull } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/cards/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { useWeapons } from "@/hooks/useWeapons";
import { MAX_GUN_LEVEL } from "@/constants/weapons";
import { cn } from "@/lib/utils";
import type { Player, PlayerRole } from "@/types";

const ROLE_LABELS: Record<PlayerRole, string> = {
  rusher: "Rusher",
  sniper: "Sniper",
  support: "Support",
  igl: "IGL",
};

const ROLE_COLORS: Record<PlayerRole, string> = {
  rusher: "bg-vred text-white border-ink",
  sniper: "bg-vpurple text-white border-ink",
  support: "bg-vgreen text-white border-ink",
  igl: "bg-vyellow text-ink border-ink",
};

export function MasteryDisplay({ player }: { player: Player }) {
  const [expanded, setExpanded] = useState(false);
  const { weapons: allWeapons } = useWeapons();
  const playerWeapons = player.weapons ?? {};
  const rolePct = player.rolePercentages ?? {};
  const titles = player.titles ?? [];
  const weaponCount = Object.keys(playerWeapons).length;

  const sortedWeapons = useMemo(
    () =>
      Object.entries(playerWeapons)
        .map(([id, level]) => ({ def: allWeapons.find((w) => w.id === id), id, level }))
        .filter((w) => w.def)
        .sort((a, b) => b.level - a.level),
    [playerWeapons, allWeapons],
  );

  const topGun = sortedWeapons[0];
  const totalLevels = sortedWeapons.reduce((s, w) => s + w.level, 0);

  function levelColor(lv: number) {
    if (lv >= 10) return "bg-vyellow text-ink border-ink";
    if (lv >= 7) return "bg-vpurple/20 text-vpurple border-vpurple";
    if (lv >= 4) return "bg-vgreen/20 text-vgreen border-vgreen";
    return "bg-cream text-ink/60 border-ink/30";
  }

  return weaponCount === 0 && titles.length === 0 && Object.keys(rolePct).length === 0 ? null : (
    <div className="mt-8">
      <h2 className="mb-3 text-2xl text-ink">Game Mastery</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Guns Leveled" value={weaponCount} icon={Crosshair} variant="blue" />
        <StatCard label="Total Levels" value={totalLevels} icon={Star} variant="green" />
        <StatCard label="Titles" value={titles.length} icon={Trophy} variant="yellow" />
        <StatCard
          label={topGun ? `Top Gun` : "—"}
          value={topGun ? `${topGun.def!.name} Lv.${topGun.level}` : "—"}
          icon={Swords}
          variant="purple"
        />
      </div>

      {/* Expand button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-sm font-bold uppercase text-ink/40 hover:text-ink"
      >
        {expanded ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Show details</>}
      </button>

      {expanded && (
        <div className="mt-4 space-y-5">
          {/* Titles list */}
          {titles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {titles.map((t, i) => (
                <Badge key={i} variant="yellow">
                  <Trophy className="mr-1 h-3 w-3" /> {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Role percentages */}
          {(Object.entries(rolePct) as [PlayerRole, number][]).filter(([, v]) => v > 0).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.entries(rolePct) as [PlayerRole, number][]).map(([role, pct]) =>
                pct > 0 ? (
                  <div key={role} className={cn("rounded-xl border-2 p-3 text-center", ROLE_COLORS[role])}>
                    <div className="text-xs font-bold uppercase">{ROLE_LABELS[role]}</div>
                    <div className="text-2xl font-bold">{pct}%</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full bg-current transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}

          {/* Full weapon grid */}
          <div>
            <span className="mb-2 block text-sm font-bold uppercase text-ink/60">
              All Guns ({weaponCount}/{allWeapons.length})
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
              {sortedWeapons.map(({ def, id, level }) => (
                <div
                  key={id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold",
                    levelColor(level),
                  )}
                >
                  <span className="truncate">{def!.name}</span>
                  <span className="ml-1 shrink-0">Lv.{level}</span>
                </div>
              ))}
            </div>

            {/* Level legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase text-ink/60">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-vyellow" /> Master (10-12)</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-vpurple" /> Pro (7-9)</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-vgreen" /> Skilled (4-6)</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-ink/30" /> Novice (1-3)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
