"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  DollarSign,
  Plus,
  UserMinus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { auth } from "@/firebase/auth";
import { cn } from "@/lib/utils";
import type { Player, Team, WithId } from "@/types";

/* ── API helper ──────────────────────────────────────────────────────────── */

async function callSquadAPI(body: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/admin/squad", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data: data as Record<string, unknown> };
}

interface Props {
  teamId: string;
  teams: WithId<Team>[];
  players: WithId<Player>[];
  /** Roster cap for the active season (defaults to MAX_SQUAD_SIZE). */
  maxSquad?: number;
  onClose: () => void;
}

export function SquadManager({ teamId, teams, players, maxSquad, onClose }: Props) {
  const max = maxSquad && maxSquad > 0 ? maxSquad : MAX_SQUAD_SIZE;
  const team = useMemo(() => teams.find((t) => t.id === teamId), [teams, teamId]);

  // Live-derived from the realtime players list (robust against squad[] drift).
  const squadPlayers = useMemo(
    () => players.filter((p) => p.teamId === teamId),
    [players, teamId],
  );
  const freeAgents = useMemo(
    () => players.filter((p) => !p.teamId && p.status === "approved"),
    [players],
  );

  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Add-player form state
  const [addSearch, setAddSearch] = useState("");
  const [addPlayerId, setAddPlayerId] = useState("");
  const [addPrice, setAddPrice] = useState(0);

  // Inline move form: which player is being moved
  const [moveFor, setMoveFor] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [movePrice, setMovePrice] = useState(0);

  if (!team) {
    // Team vanished (deleted elsewhere) — bail out cleanly.
    return null;
  }

  const squadFull = squadPlayers.length >= max;

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function release(p: WithId<Player>) {
    if (!confirm(`Release ${p.ign} back to the pool? Their ${(p.soldPrice ?? 0).toLocaleString()} coins return to ${team!.name}.`)) return;
    setBusy(p.id);
    try {
      const { ok, data } = await callSquadAPI({ action: "remove", playerId: p.id });
      if (!ok) flash((data.error as string) ?? "Failed to release player", false);
      else flash(`${p.ign} released to the pool (+${(data.refund as number ?? 0).toLocaleString()} coins)`, true);
    } finally {
      setBusy(null);
    }
  }

  async function confirmMove(p: WithId<Player>) {
    if (!moveTo) {
      flash("Pick a destination team first.", false);
      return;
    }
    setBusy(p.id);
    try {
      const { ok, data } = await callSquadAPI({
        action: "move",
        playerId: p.id,
        toTeamId: moveTo,
        price: movePrice,
      });
      if (!ok) {
        flash((data.error as string) ?? "Failed to move player", false);
      } else {
        flash(`${p.ign} → ${(data.toTeamName as string) ?? "team"} for ${(data.price as number ?? 0).toLocaleString()} coins`, true);
        setMoveFor(null);
        setMoveTo("");
        setMovePrice(0);
      }
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    if (!addPlayerId) {
      flash("Select a player to add.", false);
      return;
    }
    setBusy("add");
    try {
      const { ok, data } = await callSquadAPI({
        action: "add",
        playerId: addPlayerId,
        teamId,
        price: addPrice,
      });
      if (!ok) {
        flash((data.error as string) ?? "Failed to add player", false);
      } else {
        flash(`${(data.ign as string) ?? "Player"} added for ${(data.price as number ?? 0).toLocaleString()} coins`, true);
        setAddPlayerId("");
        setAddSearch("");
        setAddPrice(0);
      }
    } finally {
      setBusy(null);
    }
  }

  const filteredFreeAgents = freeAgents.filter(
    (p) =>
      p.ign.toLowerCase().includes(addSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(addSearch.toLowerCase()),
  );
  const otherTeams = teams.filter((t) => t.id !== teamId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-10 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border-4 border-ink bg-cream shadow-brutal-lg">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-xl border-2 border-ink bg-cream hover:bg-vred"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b-4 border-ink bg-vyellow p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.logoUrl || "/placeholder-team.svg"}
            alt={team.name}
            className="h-12 w-12 shrink-0 rounded-xl border-2 border-ink object-cover"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold uppercase leading-tight">{team.name}</h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="blue">
                <Users className="h-3 w-3" /> {squadPlayers.length}/{max}
              </Badge>
              <Badge variant="green">
                <DollarSign className="h-3 w-3" /> {team.remainingPurse?.toLocaleString() ?? 0} left
              </Badge>
              <Badge variant="cream">
                <DollarSign className="h-3 w-3" /> {team.purse?.toLocaleString() ?? 0} total
              </Badge>
            </div>
          </div>
        </div>

        {/* Status flash */}
        {msg && (
          <div
            className={cn(
              "mx-5 mt-4 rounded-2xl border-4 border-ink px-4 py-2.5 text-sm font-bold",
              msg.ok ? "bg-vgreen/25" : "bg-vred/25",
            )}
          >
            {msg.text}
          </div>
        )}

        <div className="space-y-6 p-5">
          {/* ── Current squad ── */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/60">
              Squad ({squadPlayers.length})
            </h3>
            <div className="overflow-hidden rounded-2xl border-4 border-ink">
              {squadPlayers.length === 0 ? (
                <p className="bg-cream px-4 py-6 text-center text-sm font-medium text-ink/40">
                  No players signed yet.
                </p>
              ) : (
                squadPlayers.map((p) => (
                  <div key={p.id} className="border-b-2 border-ink/10 last:border-0">
                    <div className="flex items-center gap-3 bg-cream px-3 py-2.5">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-ink bg-vpurple/20">
                        {p.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoURL} alt={p.ign} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <UserRound className="h-5 w-5 text-ink/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{p.ign}</p>
                        <p className="text-xs font-medium uppercase text-ink/50">
                          {p.role} · {(p.soldPrice ?? 0).toLocaleString()} coins
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          variant="blue"
                          size="sm"
                          disabled={busy !== null || otherTeams.length === 0}
                          onClick={() => {
                            setMoveFor(moveFor === p.id ? null : p.id);
                            setMoveTo("");
                            setMovePrice(p.soldPrice ?? 0);
                          }}
                          title={otherTeams.length === 0 ? "No other teams" : "Shift to another team"}
                        >
                          <ArrowLeftRight className="h-3 w-3" /> Move
                        </Button>
                        <Button
                          variant="red"
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => release(p)}
                        >
                          <UserMinus className="h-3 w-3" /> Release
                        </Button>
                      </div>
                    </div>

                    {/* Inline move form */}
                    {moveFor === p.id && (
                      <div className="flex flex-wrap items-end gap-2 bg-vblue/10 px-3 py-3">
                        <div className="min-w-[140px] flex-1">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-ink/50">
                            Move to
                          </label>
                          <select
                            value={moveTo}
                            onChange={(e) => setMoveTo(e.target.value)}
                            className="min-h-9 w-full rounded-xl border-2 border-ink bg-cream px-2 text-sm font-bold"
                          >
                            <option value="">Select team…</option>
                            {otherTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({(t.remainingPurse ?? 0).toLocaleString()} left)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="mb-1 block text-[10px] font-bold uppercase text-ink/50">
                            Price
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={movePrice}
                            onChange={(e) => setMovePrice(Math.max(0, Number(e.target.value)))}
                            className="min-h-9 w-full rounded-xl border-2 border-ink bg-cream px-2 text-sm font-bold"
                          />
                        </div>
                        <Button
                          variant="green"
                          size="sm"
                          disabled={busy !== null || !moveTo}
                          onClick={() => confirmMove(p)}
                        >
                          <Check className="h-3 w-3" /> Confirm
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Add a free agent ── */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/60">
              Add Player {squadFull && <span className="text-vred">— squad full</span>}
            </h3>
            <div className="space-y-3 rounded-2xl border-4 border-ink bg-cream p-3">
              <Input
                placeholder="Search free agents by IGN or role…"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                disabled={squadFull}
              />
              <div className="max-h-44 overflow-y-auto rounded-xl border-2 border-ink/20">
                {filteredFreeAgents.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm font-medium text-ink/40">
                    No available free agents
                  </p>
                ) : (
                  filteredFreeAgents.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={squadFull}
                      onClick={() => setAddPlayerId(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2 border-b-2 border-ink/10 px-3 py-2 text-left last:border-0 transition-colors disabled:opacity-50",
                        addPlayerId === p.id ? "bg-vyellow" : "bg-cream hover:bg-vyellow/30",
                      )}
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border-2 border-ink bg-vpurple/20">
                        {p.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoURL} alt={p.ign} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <UserRound className="h-4 w-4 text-ink/30" />
                          </div>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.ign}</span>
                      <Badge variant="cream">{p.role}</Badge>
                      {addPlayerId === p.id && <Check className="h-4 w-4 shrink-0 text-vgreen" />}
                    </button>
                  ))
                )}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-32">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-ink/50">
                    Price (coins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={addPrice}
                    onChange={(e) => setAddPrice(Math.max(0, Number(e.target.value)))}
                    disabled={squadFull}
                    className="min-h-9 w-full rounded-xl border-2 border-ink bg-cream px-2 text-sm font-bold disabled:opacity-50"
                  />
                </div>
                <Button
                  variant="yellow"
                  size="sm"
                  disabled={busy !== null || squadFull || !addPlayerId}
                  onClick={add}
                >
                  <Plus className="h-3 w-3" /> {busy === "add" ? "Adding…" : "Add to Squad"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t-4 border-ink p-4">
          <Button variant="cream" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
