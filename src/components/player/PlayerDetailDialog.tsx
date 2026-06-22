"use client";

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Trophy, UserRound, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MasteryDisplay } from "@/components/player/MasteryDisplay";
import { COLLECTIONS } from "@/firebase/collections";
import { db } from "@/firebase/firestore";
import { usePlayerMatchHistory, usePlayerSeasonStats } from "@/hooks/usePlayers";
import { useTeam } from "@/hooks/useTeams";
import type { Player, WithId } from "@/types";

interface Props {
  player: WithId<Player>;
  teamName?: string;
  onClose: () => void;
}

export function PlayerDetailDialog({ player, teamName, onClose }: Props) {
  const { data: stats } = usePlayerSeasonStats(player.id);
  const { data: matchHistory } = usePlayerMatchHistory(player.id);
  const { data: team } = useTeam(player.teamId ?? null);
  const [titleInput, setTitleInput] = useState("");
  const [saving, setSaving] = useState(false);

  const titles = player.titles ?? [];

  async function addTitle() {
    if (!titleInput.trim()) return;
    setSaving(true);
    try {
      const next = [...titles, titleInput.trim()];
      await updateDoc(doc(db, COLLECTIONS.players, player.id), {
        titles: next,
        updatedAt: serverTimestamp(),
      });
      setTitleInput("");
    } finally {
      setSaving(false);
    }
  }

  async function removeTitle(title: string) {
    setSaving(true);
    try {
      const next = titles.filter((t) => t !== title);
      await updateDoc(doc(db, COLLECTIONS.players, player.id), {
        titles: next,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 backdrop-blur-sm p-4 pt-12">
      <div className="relative w-full max-w-2xl rounded-3xl border-4 border-ink bg-cream shadow-brutal-lg">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border-2 border-ink bg-cream hover:bg-vred"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 border-b-4 border-ink p-5 sm:flex-row sm:items-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/40 sm:h-24 sm:w-24">
            {player.photoURL ? (
              <Image src={player.photoURL} alt={player.ign} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="grid h-full place-items-center">
                <UserRound className="h-10 w-10 text-ink/30" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{player.ign}</h2>
              <Badge variant={player.status === "approved" ? "green" : player.status === "rejected" ? "red" : "yellow"}>
                {player.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="blue">{player.role}</Badge>
              {player.device && <Badge variant="cream">{player.device}</Badge>}
              <Badge variant="purple">{team?.name ?? teamName ?? "Free Agent"}</Badge>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Season stats */}
          <div>
            <h3 className="mb-2 text-lg font-bold uppercase">Season Stats</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border-2 border-ink bg-vpurple/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">Overall Rank</div>
                <div className="text-xl font-bold">{stats?.overallRank ? `#${stats.overallRank}` : "—"}</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-vyellow/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">Rating</div>
                <div className="text-xl font-bold">{stats?.performanceScore ?? 0}</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-vblue/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">Matches</div>
                <div className="text-xl font-bold">{stats?.matchesPlayed ?? 0}</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-vred/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">Kills</div>
                <div className="text-xl font-bold">{stats?.kills ?? 0}</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-vgreen/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">Headshots</div>
                <div className="text-xl font-bold">{stats?.headshots ?? 0}</div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-vyellow/20 p-3 text-center">
                <div className="text-xs font-bold uppercase text-ink/60">MVP</div>
                <div className="text-xl font-bold">{stats?.mvpAwards ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Game Mastery */}
          <MasteryDisplay player={player} />

          {/* Titles management */}
          <div>
            <h3 className="mb-2 text-lg font-bold uppercase">Titles</h3>
            <div className="flex flex-wrap gap-2">
              {titles.length === 0 && <span className="text-sm text-ink/40">No titles yet</span>}
              {titles.map((t, i) => (
                <Badge key={i} variant="yellow" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> {t}
                  <button
                    type="button"
                    onClick={() => removeTitle(t)}
                    className="ml-0.5 text-ink/40 hover:text-vred"
                    disabled={saving}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Add title…"
                className="min-h-9 flex-1 rounded-xl border-2 border-ink bg-cream px-3 text-sm font-bold"
                onKeyDown={(e) => e.key === "Enter" && addTitle()}
              />
              <Button variant="yellow" size="sm" onClick={addTitle} disabled={saving || !titleInput.trim()}>
                <Trophy className="h-3 w-3" /> Grant
              </Button>
            </div>
          </div>

          {/* Match history */}
          {matchHistory.length > 0 && (
            <div>
              <h3 className="mb-2 text-lg font-bold uppercase">Match History</h3>
              <div className="space-y-1">
                {matchHistory.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-cream px-3 py-2 text-sm">
                    <span className="font-bold">{s.kills} K</span>
                    <span className="text-ink/60">{s.headshots} HS</span>
                    <span className="text-ink/60">{s.damage} DMG</span>
                    {s.mvp && <Badge variant="yellow">MVP</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal info */}
          <details className="rounded-xl border-2 border-ink/20 p-3">
            <summary className="cursor-pointer text-xs font-bold uppercase text-ink/40">
              Internal IDs
            </summary>
            <div className="mt-2 space-y-1 text-xs text-ink/40">
              <p>Player ID: {player.id}</p>
              <p>Auth UID: {player.uid}</p>
              {player.teamId && <p>Team ID: {player.teamId}</p>}
              {typeof player.soldPrice === "number" && <p>Sold Price: {player.soldPrice.toLocaleString()} coins</p>}
              {player.approvedBy && <p>Approved by: {player.approvedBy}</p>}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
