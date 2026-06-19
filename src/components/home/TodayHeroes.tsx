"use client";

import { useMemo } from "react";
import { Flame, Skull, Star, Target, UserRound } from "lucide-react";
import { useMatches, useMatchPlayerStats } from "@/hooks/useMatches";
import { usePlayers } from "@/hooks/usePlayers";
import type { PlayerMatchStats, WithId } from "@/types";

/* ── Hero category config ─────────────────────────────────────────────────── */

interface HeroCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
  getValue: (s: WithId<PlayerMatchStats>) => number;
  formatValue: (n: number) => string;
  unit: string;
}

const CATEGORIES: HeroCategory[] = [
  {
    key: "kills",
    label: "Kill King",
    icon: Skull,
    color: "bg-vred",
    badgeColor: "#ff6b6b",
    getValue: (s) => s.kills,
    formatValue: (n) => String(n),
    unit: "kills",
  },
  {
    key: "damage",
    label: "Damage King",
    icon: Flame,
    color: "bg-vpurple",
    badgeColor: "#c4b5fd",
    getValue: (s) => s.damage,
    formatValue: (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n),
    unit: "damage",
  },
  {
    key: "headshots",
    label: "Headshot Master",
    icon: Target,
    color: "bg-vgreen",
    badgeColor: "#4ade80",
    getValue: (s) => s.headshots,
    formatValue: (n) => String(n),
    unit: "headshots",
  },
  {
    key: "mvp",
    label: "Match MVP",
    icon: Star,
    color: "bg-vyellow",
    badgeColor: "#ffd93d",
    getValue: (s) => s.mvp ? 1 : 0,
    formatValue: () => "MVP",
    unit: "",
  },
];

/* ── Individual hero card ─────────────────────────────────────────────────── */

interface HeroData {
  category: HeroCategory;
  stat: WithId<PlayerMatchStats>;
  ign: string;
  teamName?: string;
  value: number;
}

function HeroCard({ hero }: { hero: HeroData }) {
  const Icon = hero.category.icon;
  const displayVal = hero.category.formatValue(hero.value);

  return (
    <div className="flex w-52 shrink-0 flex-col overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md transition-transform hover:-translate-y-1 sm:w-56">
      {/* Category tag */}
      <div className={`flex items-center gap-2 border-b-4 border-ink px-4 py-3 ${hero.category.color}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-widest">
          {hero.category.label}
        </span>
      </div>

      {/* Player avatar placeholder */}
      <div className="flex flex-col items-center gap-2 bg-ink px-4 py-5">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-4 border-white/10 bg-white/5">
          <UserRound className="h-8 w-8 text-white/20" />
        </div>
        <p className="truncate text-center text-sm font-bold text-white">{hero.ign}</p>
        {hero.teamName && (
          <p className="truncate text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
            {hero.teamName}
          </p>
        )}
      </div>

      {/* Value */}
      <div className="bg-cream px-4 py-4 text-center">
        <p className="text-3xl font-bold">{displayVal}</p>
        {hero.category.unit && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
            {hero.category.unit}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

export function TodayHeroes() {
  const { data: matches } = useMatches();
  const { data: players } = usePlayers();

  const recentMatchId = useMemo(() => {
    return [...matches]
      .filter((m) => m.status === "completed")
      .sort(
        (a, b) =>
          (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0),
      )
      [0]?.id ?? null;
  }, [matches]);

  const { data: matchStats } = useMatchPlayerStats(recentMatchId);

  const ignByPlayerId = useMemo(
    () => new Map(players.map((p) => [p.id, p.ign])),
    [players],
  );

  const heroes = useMemo<HeroData[]>(() => {
    if (!matchStats.length) return [];

    const byKills = [...matchStats].sort((a, b) => b.kills - a.kills);

    return CATEGORIES.flatMap((cat) => {
      let best: WithId<PlayerMatchStats> | undefined;

      if (cat.key === "mvp") {
        best = matchStats.find((s) => s.mvp) ?? byKills[0];
      } else {
        best = [...matchStats].sort((a, b) => cat.getValue(b) - cat.getValue(a))[0];
      }

      if (!best) return [];

      return [
        {
          category: cat,
          stat: best,
          ign: ignByPlayerId.get(best.playerId) ?? best.playerId,
          value: cat.getValue(best),
        },
      ];
    });
  }, [matchStats, ignByPlayerId]);

  if (!heroes.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      {/* Heading */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Last Match
          </p>
          <h2 className="text-3xl font-bold uppercase sm:text-4xl">
            Today&apos;s Heroes
          </h2>
        </div>
        <span className="rounded-xl border-2 border-vyellow bg-vyellow px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          ⭐ Match Day
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-5 overflow-x-auto pb-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {heroes.map((h) => (
          <div key={h.category.key} style={{ scrollSnapAlign: "start" }}>
            <HeroCard hero={h} />
          </div>
        ))}
      </div>
    </section>
  );
}
