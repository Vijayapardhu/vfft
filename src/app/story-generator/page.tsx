"use client";

import { useState, useMemo } from "react";
import { Download, ExternalLink, Flame, Gamepad2, Shield, Skull, Star, Target, UserRound } from "lucide-react";
import { useMyPlayer, useTeamPlayers, usePlayers } from "@/hooks/usePlayers";
import { usePlayerSeasonStats } from "@/hooks/usePlayers";
import { useTeam, useTeams } from "@/hooks/useTeams";
import { useMatches, useMatchResults, useMatchPlayerStats } from "@/hooks/useMatches";
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
  const { data: team } = useTeam(player?.teamId ?? null);
  const { data: squadPlayers } = useTeamPlayers(player?.teamId ?? null);

  const [mode, setMode] = useState<"player" | "team" | "match">("player");
  const [selectedType, setSelectedType] = useState<AchievementType>("kills");

  // Match story data
  const { data: matches } = useMatches();
  const { data: teams } = useTeams();
  const { data: allPlayers } = usePlayers();
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const { data: matchResults } = useMatchResults(selectedMatchId || null);
  const { data: matchStats } = useMatchPlayerStats(selectedMatchId || null);
  const playableMatches = useMemo(
    () =>
      [...matches]
        .filter((m) => m.status === "completed" || m.status === "live")
        .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)),
    [matches],
  );

  const matchOgUrl = useMemo(() => {
    if (!selectedMatch) return null;
    const t1 = teams.find((t) => t.id === selectedMatch.team1Id);
    const t2 = teams.find((t) => t.id === selectedMatch.team2Id);
    const r1 = matchResults.find((r) => r.teamId === selectedMatch.team1Id);
    const r2 = matchResults.find((r) => r.teamId === selectedMatch.team2Id);
    const params = new URLSearchParams();
    params.set("title", selectedMatch.name || `Match ${selectedMatch.matchNumber}`);
    params.set("code", selectedMatch.id.slice(0, 12));
    if (selectedMatch.map) params.set("map", selectedMatch.map);
    params.set("t1", t1?.name ?? "Team 1");
    params.set("t2", t2?.name ?? "Team 2");
    if (r1) params.set("s1", String(r1.totalPoints ?? 0));
    if (r2) params.set("s2", String(r2.totalPoints ?? 0));
    params.set("win", r1?.outcome === "win" ? "1" : r2?.outcome === "win" ? "2" : "0");
    params.set("color", (t1?.primaryColor ?? "#4f46e5").replace(/^#/, ""));
    for (const s of matchStats) {
      const p = allPlayers.find((pl) => pl.id === s.playerId);
      params.append("pn", p?.ign ?? "Player");
      params.append("pk", String(s.kills ?? 0));
      params.append("pd", String(s.damage ?? 0));
    }
    return `/api/og/match?${params.toString()}`;
  }, [selectedMatch, teams, matchResults, matchStats, allPlayers]);

  // Team story: leader (no price, shown as LEADER) + remaining squad with bids.
  const teamOgUrl = useMemo(() => {
    if (!team) return null;
    const params = new URLSearchParams();
    params.set("team", team.name);
    params.set("color", (team.primaryColor ?? "#4f46e5").replace(/^#/, ""));
    params.set("color2", (team.secondaryColor ?? team.primaryColor ?? "#ff6b6b").replace(/^#/, ""));
    if (team.logoUrl) params.set("logo", team.logoUrl);
    if (team.bannerUrl) params.set("banner", team.bannerUrl);
    const leader =
      squadPlayers.find((p) => p.uid === team.teamLeaderUid) ??
      squadPlayers.find((p) => p.uid === team.ownerUid);
    if (leader) {
      params.set("lname", leader.ign);
      if (leader.photoURL) params.set("lphoto", leader.photoURL);
    }
    for (const p of squadPlayers) {
      if (leader && p.id === leader.id) continue;
      params.append("pn", p.ign);
      params.append("pp", String(p.soldPrice ?? 0));
      params.append("pi", p.photoURL ?? "");
    }
    return `/api/og/team?${params.toString()}`;
  }, [team, squadPlayers]);

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

  const previewUrl =
    mode === "team" ? teamOgUrl : mode === "match" ? matchOgUrl : ogUrl ?? demoUrl;

  function handleDownload() {
    if (previewUrl) window.open(previewUrl, "_blank");
  }

  function handleCopy() {
    if (!previewUrl) return;
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
            {/* Mode toggle: player card / team story / match story */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "player", label: "My Card", icon: Star },
                { id: "team", label: "Team", icon: Shield },
                { id: "match", label: "Match", icon: Gamepad2 },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl border-4 border-ink px-3 py-3 text-sm font-bold uppercase transition-all",
                    mode === m.id ? "bg-vyellow shadow-brutal-sm" : "bg-cream hover:bg-vyellow/20",
                  )}
                >
                  <m.icon className="h-4 w-4" /> {m.label}
                </button>
              ))}
            </div>

            {/* Match mode: pick a match */}
            {mode === "match" && (
              <div className="space-y-2 rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50">Select Match</p>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-3 py-2 text-sm font-bold"
                >
                  <option value="">Choose a match…</option>
                  {playableMatches.map((m) => {
                    const a = teams.find((t) => t.id === m.team1Id)?.name ?? "Team 1";
                    const b = teams.find((t) => t.id === m.team2Id)?.name ?? "Team 2";
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name || `Match ${m.matchNumber}`} — {a} vs {b}
                      </option>
                    );
                  })}
                </select>
                {selectedMatch && (
                  <p className="text-xs font-medium text-ink/60">
                    Highest kills &amp; damage are highlighted in the poster.
                  </p>
                )}
                {playableMatches.length === 0 && (
                  <p className="text-xs font-medium text-ink/50">No completed matches yet.</p>
                )}
              </div>
            )}

            {/* Team mode info */}
            {mode === "team" && (
              team ? (
                <div className="rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-sm">
                  <p className="font-bold uppercase">{team.name}</p>
                  <p className="mt-1 text-xs font-medium text-ink/60">
                    {squadPlayers.length} player{squadPlayers.length === 1 ? "" : "s"} · leader shown
                    as <span className="font-bold">LEADER</span>, the rest with their auction bid value.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border-4 border-vyellow bg-vyellow/10 px-5 py-4">
                  <p className="text-sm font-bold">No team yet.</p>
                  <p className="mt-1 text-xs font-medium text-ink/60">
                    Sign in as a player on a franchise to generate your team story.
                  </p>
                </div>
              )
            )}

            {/* Player status */}
            {mode === "player" && !playerLoading && !player && (
              <div className="rounded-2xl border-4 border-vyellow bg-vyellow/10 px-5 py-4">
                <p className="text-sm font-bold">
                  Not logged in as a player — showing demo card.
                </p>
                <p className="mt-1 text-xs font-medium text-ink/60">
                  Sign in to generate your personal achievement card.
                </p>
              </div>
            )}
            {mode === "player" && player && (
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
            {mode === "player" && (
            <>
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
            </>
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
              className="grid place-items-center overflow-hidden rounded-3xl border-4 border-ink bg-ink/5 shadow-brutal-md"
              style={{ aspectRatio: "1080/1920" }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Story preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="px-6 text-center text-sm font-medium text-ink/40">
                  {mode === "match"
                    ? "Pick a match above to generate the highlights poster."
                    : "Join a franchise to generate your team story."}
                </p>
              )}
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
