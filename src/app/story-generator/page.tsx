"use client";

import { useState, useMemo } from "react";
import { Download, ExternalLink, Flame, Skull, Star, Target, UserRound } from "lucide-react";
import { useMyPlayer } from "@/hooks/usePlayers";
import { usePlayerSeasonStats } from "@/hooks/usePlayers";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────────────────────── */

type AchievementType = "kills" | "damage" | "headshots" | "mvp";

interface TypeOption {
  id: AchievementType;
  label: string;
  icon: React.ElementType;
  color: string;
  getValue: (stats: { kills: number; damage: number; headshots: number; mvpAwards: number }) => number;
  unit: string;
  formatValue: (n: number) => string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    id: "kills",
    label: "Kill King",
    icon: Skull,
    color: "bg-vred",
    getValue: (s) => s.kills,
    unit: "kills",
    formatValue: (n) => String(n),
  },
  {
    id: "damage",
    label: "Damage King",
    icon: Flame,
    color: "bg-vpurple",
    getValue: (s) => s.damage,
    unit: "damage",
    formatValue: (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n),
  },
  {
    id: "headshots",
    label: "Headshot Master",
    icon: Target,
    color: "bg-vgreen",
    getValue: (s) => s.headshots,
    unit: "headshots",
    formatValue: (n) => String(n),
  },
  {
    id: "mvp",
    label: "Match MVP",
    icon: Star,
    color: "bg-vyellow",
    getValue: (s) => s.mvpAwards,
    unit: "MVP awards",
    formatValue: (n) => String(n),
  },
];

/* ── Helper ──────────────────────────────────────────────────────────────── */

function buildOgUrl(params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return `/api/og/player?${q}`;
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function StoryGeneratorPage() {
  const { player, loading: playerLoading } = useMyPlayer();
  const { data: stats } = usePlayerSeasonStats(player?.id ?? null);

  const [selectedType, setSelectedType] = useState<AchievementType>("kills");

  const activeStat = stats as {
    kills: number;
    damage: number;
    headshots: number;
    mvpAwards: number;
  } | null;

  const activeOption = TYPE_OPTIONS.find((t) => t.id === selectedType)!;

  const statValue = activeStat ? activeOption.getValue(activeStat) : 0;
  const displayValue = activeOption.formatValue(statValue);

  const ogUrl = useMemo(() => {
    if (!player) return null;
    return buildOgUrl({
      ign: player.ign,
      type: selectedType,
      value: displayValue,
      unit: activeOption.unit,
      team: player.teamId ?? "Free Agent",
      color: "4f46e5",
      kills: String(activeStat?.kills ?? 0),
      damage: String(activeStat?.damage ?? 0),
      hs: String(activeStat?.headshots ?? 0),
      ...(player.photoURL ? { photo: player.photoURL } : {}),
    });
  }, [player, selectedType, displayValue, activeOption.unit, activeStat]);

  const demoUrl = useMemo(
    () =>
      buildOgUrl({
        ign: "ShadowOP",
        type: selectedType,
        value: selectedType === "kills" ? "15" : selectedType === "damage" ? "4.2k" : selectedType === "headshots" ? "8" : "3",
        unit: activeOption.unit,
        team: "Shadow Warriors",
        color: "6366f1",
        kills: "15",
        damage: "4200",
        hs: "8",
      }),
    [selectedType, activeOption.unit],
  );

  const previewUrl = ogUrl ?? demoUrl;

  function handleDownload() {
    window.open(previewUrl, "_blank");
  }

  function handleCopy() {
    const fullUrl = `${window.location.origin}${previewUrl}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
  }

  return (
    <div className="min-h-dvh bg-cream">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-ink px-5 py-16 text-center">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <div className="relative">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-vyellow">
            Share Your Glory
          </p>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Story Generator</h1>
          <p className="mt-3 text-sm font-medium text-white/50">
            Create your achievement card. Share to Instagram, WhatsApp & Discord.
          </p>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-6">
            {/* Player status */}
            {!playerLoading && !player && (
              <div className="rounded-2xl border-4 border-vyellow bg-vyellow/10 px-5 py-4">
                <p className="text-sm font-bold">
                  Not logged in as a player — showing demo card.
                </p>
                <p className="mt-1 text-xs font-medium text-ink/60">
                  Sign in to generate your personal achievement card.
                </p>
              </div>
            )}
            {player && (
              <div className="flex items-center gap-4 rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-sm">
                <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-ink bg-vpurple/20">
                  {player.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoURL} alt={player.ign} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-6 w-6 text-ink/30" />
                  )}
                </div>
                <div>
                  <p className="font-bold uppercase">{player.ign}</p>
                  <p className="text-xs font-medium text-ink/50">Season Stats loaded</p>
                </div>
              </div>
            )}

            {/* Achievement type selector */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink/50">
                Achievement Type
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedType(opt.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-4 border-ink px-4 py-3 text-left transition-all",
                        selectedType === opt.id
                          ? `${opt.color} shadow-brutal-sm`
                          : "bg-cream hover:bg-vyellow/20",
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-bold uppercase">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stat preview */}
            {activeStat && (
              <div className="overflow-hidden rounded-2xl border-4 border-ink shadow-brutal-sm">
                <div className="grid grid-cols-3 divide-x-4 divide-ink border-b-4 border-ink">
                  {[
                    { label: "Kills", val: activeStat.kills },
                    { label: "Damage", val: activeStat.damage },
                    { label: "HS", val: activeStat.headshots },
                  ].map((s) => (
                    <div key={s.label} className="bg-cream px-4 py-3 text-center">
                      <p className="text-xl font-bold">{s.val}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-cream px-4 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    Season totals · auto-updated
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-ink bg-ink py-3 font-bold text-cream shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-ink bg-vyellow py-3 font-bold shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ExternalLink className="h-4 w-4" />
                Copy Link
              </button>
            </div>

            <p className="text-center text-[11px] font-medium text-ink/40">
              Tap &ldquo;Download PNG&rdquo; → long-press the image → Save.
              <br />
              Share to Instagram Stories, WhatsApp Status & Discord.
            </p>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
              Preview (1080 × 1920)
            </p>
            <div
              className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md"
              style={{ aspectRatio: "1080/1920" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previewUrl}
                src={previewUrl}
                alt="Story preview"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-center text-[11px] font-medium text-ink/40">
              Instagram Story · WhatsApp Status · 9:16
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
