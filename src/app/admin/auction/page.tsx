"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, query, where } from "firebase/firestore";
import {
  CheckCircle,
  Gavel,
  Hammer,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  UserRound,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeAuction } from "@/hooks/useRealtimeAuction";
import { useAuctionFeed, useSoldBoard } from "@/hooks/useAuction";
import { usePlayers } from "@/hooks/usePlayers";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCollectionData } from "@/hooks/useFirestore";
import { db } from "@/firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { auth } from "@/firebase/auth";
import { cn } from "@/lib/utils";
import type { WithId } from "@/types";
import type { Player } from "@/types";

/* ── API helper ──────────────────────────────────────────────────────────── */

async function callAuctionAPI(path: string, body: object): Promise<{ ok: boolean; data: unknown }> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/* ── Player picker ───────────────────────────────────────────────────────── */

function PlayerPicker({
  players,
  value,
  onChange,
}: {
  players: WithId<Player>[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = players.filter(
    (p) =>
      p.ign.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = players.find((p) => p.id === value);

  return (
    <div className="space-y-2">
      <Label>Player to Auction</Label>
      <Input
        placeholder="Search by IGN or role…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-52 overflow-y-auto rounded-2xl border-4 border-ink">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-sm font-medium text-ink/50">No available players</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setSearch(""); }}
              className={cn(
                "flex w-full items-center gap-3 border-b-2 border-ink/10 px-4 py-3 text-left last:border-0 transition-colors",
                value === p.id
                  ? "bg-vyellow"
                  : "bg-cream hover:bg-vyellow/30",
              )}
            >
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
                <p className="text-xs font-medium uppercase text-ink/50">{p.role}</p>
              </div>
              {value === p.id && <CheckCircle className="h-4 w-4 shrink-0 text-vgreen" />}
            </button>
          ))
        )}
      </div>
      {selected && (
        <p className="text-xs font-bold text-ink/60">
          Selected: <span className="text-ink">{selected.ign}</span>
        </p>
      )}
    </div>
  );
}

/* ── Live timer ring ─────────────────────────────────────────────────────── */

function TimerRing({ seconds, max }: { seconds: number; max: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const frac = max > 0 ? Math.max(0, Math.min(1, seconds / max)) : 0;
  const dash = circ * frac;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds <= 10 && seconds > 0;

  return (
    <div className={cn(
      "relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-ink",
      urgent ? "bg-vred/10" : "bg-cream",
    )}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" width="96" height="96">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={urgent ? "#ff6b6b" : "#4ade80"}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.2s linear" }}
        />
      </svg>
      <div className="relative text-center">
        <p className={cn("text-xl font-bold leading-none", urgent && "text-vred")}>
          {mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`}
        </p>
        {urgent && <p className="text-[9px] font-bold uppercase tracking-wider text-vred">Hurry!</p>}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function AdminAuctionPage() {
  const { auction, loading: auctionLoading } = useRealtimeAuction();
  const { data: players } = usePlayers();
  const { seasonId } = useActiveSeason();
  const bidFeed = useAuctionFeed();
  const soldEntries = useSoldBoard();

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [basePrice, setBasePrice] = useState(1000);
  const [mode, setMode] = useState<"manual" | "timed">("manual");
  const [timerSecs, setTimerSecs] = useState(60);
  const [saving, setSaving] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resultMsg, setResultMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!auction?.endsAt) { setSecondsLeft(0); return; }
    const update = () =>
      setSecondsLeft(Math.max(0, Math.ceil((auction.endsAt! - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [auction?.endsAt, auction?.auctionId]);

  // Auto-dismiss result message after 5 s
  useEffect(() => {
    if (!resultMsg) return;
    const id = setTimeout(() => setResultMsg(null), 5000);
    return () => clearTimeout(id);
  }, [resultMsg]);

  /* Unsold auctions — filter client-side to avoid composite index requirement */
  const unsoldQuery = useMemo(
    () => (seasonId ? query(collection(db, COLLECTIONS.auctions), where("seasonId", "==", seasonId)) : null),
    [seasonId],
  );
  const { data: allAuctions } = useCollectionData(unsoldQuery, [seasonId]);
  const unsoldAuctions = useMemo(
    () =>
      allAuctions
        .filter((a) => (a as unknown as { status: string }).status === "unsold")
        .sort(
          (a, b) =>
            ((b as unknown as { updatedAt?: { toMillis: () => number } }).updatedAt?.toMillis() ?? 0) -
            ((a as unknown as { updatedAt?: { toMillis: () => number } }).updatedAt?.toMillis() ?? 0),
        )
        .slice(0, 20),
    [allAuctions],
  );

  const availablePlayers = useMemo(
    () => players.filter((p) => !p.teamId && p.status === "approved"),
    [players],
  );

  /* ─ Actions ─ */

  async function handleStart() {
    if (!selectedPlayer || !seasonId) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { playerId: selectedPlayer, seasonId, basePrice, mode };
      if (mode === "timed") body.timerSeconds = timerSecs;
      const { ok, data } = await callAuctionAPI("/api/auction/start", body);
      if (!ok) {
        alert((data as { error?: string })?.error ?? "Failed to start auction");
        return;
      }
      setShowStartForm(false);
      setSelectedPlayer("");
      setResultMsg(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleHammer() {
    if (!auction?.auctionId) return;
    if (!confirm("Close bidding now? Teams won't be able to bid after this.")) return;
    setSaving(true);
    try {
      const { ok, data } = await callAuctionAPI("/api/auction/hammer", { auctionId: auction.auctionId });
      if (!ok) alert((data as { error?: string })?.error ?? "Failed to close bidding");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!auction?.auctionId) return;
    setSaving(true);
    setResultMsg(null);
    try {
      const { ok, data } = await callAuctionAPI("/api/auction/finalize", { auctionId: auction.auctionId });
      const d = data as { status?: string; ign?: string; teamName?: string; soldPrice?: number; error?: string };
      if (!ok) { alert(d.error ?? "Failed to settle auction"); return; }
      if (d.status === "sold") {
        setResultMsg({ ok: true, text: `Sold! ${d.ign ?? "Player"} → ${d.teamName ?? "—"} for ${(d.soldPrice ?? 0).toLocaleString()} coins` });
      } else {
        setResultMsg({ ok: false, text: "No bids — marked as unsold" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!confirm("Reset the auction board? This clears the current lot without settling.")) return;
    setSaving(true);
    try {
      const { ok, data } = await callAuctionAPI("/api/auction/clear", {});
      if (!ok) alert((data as { error?: string })?.error ?? "Failed to clear auction");
      else setResultMsg({ ok: true, text: "Auction board cleared" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReAuction(playerId: string) {
    if (!seasonId) return;
    const p = players.find((pl) => pl.id === playerId);
    if (!p) return;
    setSelectedPlayer(playerId);
    setShowStartForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (auctionLoading) {
    return (
      <div>
        <AdminHeader title="Auction" subtitle="Loading…" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Auction"
        subtitle={auction ? `Live — ${auction.playerName}` : "No active auction"}
        action={
          <div className="flex gap-2">
            {auction && (
              <Button variant="red" size="sm" onClick={handleClear} disabled={saving}>
                <RotateCcw className="h-4 w-4" /> Clear Board
              </Button>
            )}
            <Button
              variant="yellow"
              size="sm"
              onClick={() => setShowStartForm(!showStartForm)}
              disabled={!!auction}
              title={auction ? "Settle the current auction first" : undefined}
            >
              <Gavel className="h-4 w-4" /> Start Auction
            </Button>
          </div>
        }
      />

      {/* Result toast */}
      {resultMsg && (
        <div
          className={cn(
            "mb-5 flex items-center justify-between gap-3 rounded-2xl border-4 border-ink px-5 py-3",
            resultMsg.ok ? "bg-vgreen/20" : "bg-vred/20",
          )}
        >
          <p className="font-bold">{resultMsg.text}</p>
          <button
            type="button"
            onClick={() => setResultMsg(null)}
            className="rounded-lg border-2 border-ink/20 p-1 hover:bg-ink/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Start Auction Form */}
      {showStartForm && (
        <div className="mb-8 overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
          <div className="flex items-center justify-between border-b-4 border-ink bg-vyellow px-5 py-3">
            <h2 className="font-bold uppercase">New Auction</h2>
            <button
              type="button"
              onClick={() => setShowStartForm(false)}
              className="rounded-lg border-2 border-ink bg-cream/60 p-1 hover:bg-cream"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-5 bg-cream p-5">
            <PlayerPicker
              players={availablePlayers}
              value={selectedPlayer}
              onChange={setSelectedPlayer}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Base Price (coins)</Label>
                <Input
                  type="number"
                  min={100}
                  step={100}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "manual" | "timed")}
                >
                  <option value="manual">Manual — admin controls timing</option>
                  <option value="timed">Timed — auto-closes on countdown</option>
                </Select>
              </div>
              {mode === "timed" && (
                <div>
                  <Label>Timer (seconds)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={timerSecs}
                    onChange={(e) => setTimerSecs(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t-2 border-ink/10 pt-4">
              <Button variant="cream" onClick={() => setShowStartForm(false)}>
                Cancel
              </Button>
              <Button
                variant="yellow"
                onClick={handleStart}
                disabled={!selectedPlayer || saving}
              >
                <Gavel className="h-4 w-4" />
                {saving ? "Starting…" : "Start Auction"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Auction + Bid Feed */}
      {auction ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Current lot */}
          <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
            {/* Header */}
            <div className="flex items-center gap-2 border-b-4 border-ink bg-vred px-5 py-3">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-wider">Live Auction</span>
              <Badge variant="red" className="ml-auto">
                {auction.status}
              </Badge>
            </div>

            <div className="bg-cream p-5 space-y-5">
              {/* Player info */}
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-ink bg-vpurple/20">
                  {auction.playerPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={auction.playerPhoto}
                      alt={auction.playerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <UserRound className="h-10 w-10 text-ink/30" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                    Now auctioning
                  </p>
                  <h2 className="truncate text-3xl font-bold">{auction.playerName}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="blue">{auction.playerRole || "Player"}</Badge>
                    <span className="text-xs font-bold text-ink/50">
                      Base: {auction.basePrice.toLocaleString()} coins
                    </span>
                  </div>
                </div>
                {/* Timer (timed mode only) */}
                {auction.mode === "timed" && secondsLeft > 0 && (
                  <TimerRing seconds={secondsLeft} max={auction.timerSeconds || 60} />
                )}
              </div>

              {/* Current bid */}
              <div className="overflow-hidden rounded-2xl border-4 border-ink bg-vyellow p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink/50">
                  Current Bid
                </p>
                <p className="text-5xl font-bold tracking-tight">
                  {auction.currentBid.toLocaleString()}
                  <span className="ml-1 text-base font-bold text-ink/40">coins</span>
                </p>
                {auction.highestBidTeamName && (
                  <p className="mt-1 text-sm font-bold">
                    Leading: {auction.highestBidTeamName}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-3 border-t-2 border-ink/10 pt-2">
                <Button
                  variant="yellow"
                  onClick={handleHammer}
                  disabled={saving}
                >
                  <Hammer className="h-4 w-4" />
                  Close Bidding
                </Button>
                <Button
                  variant="green"
                  onClick={handleFinalize}
                  disabled={saving}
                >
                  <CheckCircle className="h-4 w-4" />
                  Settle &amp; Assign
                </Button>
                <Button
                  variant="red"
                  onClick={handleClear}
                  disabled={saving}
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear &amp; Skip
                </Button>
              </div>
            </div>
          </div>

          {/* Live bid feed */}
          <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-md">
            <div className="flex items-center gap-2 border-b-4 border-ink bg-ink px-5 py-3">
              <Timer className="h-4 w-4 text-white" />
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                Bid Feed
              </span>
              {bidFeed.length > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-vred text-[10px] font-bold text-white">
                  {bidFeed.length}
                </span>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto bg-cream">
              {bidFeed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                  <Gavel className="h-8 w-8 text-ink/20" />
                  <p className="text-sm font-medium text-ink/40">
                    Waiting for bids…
                  </p>
                </div>
              ) : (
                bidFeed.map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between gap-2 border-b-2 border-ink/10 px-4 py-3 last:border-0",
                      i === 0 && "bg-vgreen/10",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{entry.teamName}</p>
                      <p className="text-[10px] font-medium text-ink/40">
                        {new Date(entry.ts).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant={i === 0 ? "green" : "cream"}>
                      {entry.amount.toLocaleString()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No active auction */
        <div className="mb-8 overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm">
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center bg-cream">
            <div className="grid h-20 w-20 place-items-center rounded-3xl border-4 border-ink bg-vyellow shadow-brutal-md">
              <Gavel className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold uppercase">No Active Auction</h2>
            <p className="text-sm font-medium text-ink/50">
              Select a player above to start bidding.
            </p>
            <Button variant="yellow" onClick={() => setShowStartForm(true)}>
              <Play className="h-4 w-4" />
              Start Auction
            </Button>
          </div>
        </div>
      )}

      {/* History — sold + unsold */}
      <h2 className="mb-4 mt-10 text-xl font-bold uppercase tracking-tight">History</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Sold */}
        <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm">
          <div className="flex items-center gap-2 border-b-4 border-ink bg-vgreen px-5 py-3">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Sold ({soldEntries.length})
            </span>
          </div>
          <div className="bg-cream">
            {soldEntries.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm font-medium text-ink/40">
                No players sold yet
              </p>
            ) : (
              soldEntries.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b-2 border-ink/10 px-4 py-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{e.ign}</p>
                    <p className="truncate text-xs font-medium text-ink/50">
                      → {e.teamName}
                    </p>
                  </div>
                  <Badge variant="green">
                    {e.price.toLocaleString()}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unsold */}
        <div className="overflow-hidden rounded-3xl border-4 border-ink shadow-brutal-sm">
          <div className="flex items-center gap-2 border-b-4 border-ink bg-vred px-5 py-3">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Unsold ({unsoldAuctions.length})
            </span>
          </div>
          <div className="bg-cream">
            {unsoldAuctions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm font-medium text-ink/40">
                No unsold players
              </p>
            ) : (
              unsoldAuctions.map((a) => {
                const data = a as unknown as { playerId: string; basePrice: number };
                const p = players.find((pl) => pl.id === data.playerId);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 border-b-2 border-ink/10 px-4 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{p?.ign ?? "Unknown"}</p>
                      <p className="text-xs font-medium text-ink/50">
                        Base: {data.basePrice.toLocaleString()} coins
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReAuction(data.playerId)}
                      className="shrink-0 rounded-xl border-2 border-ink bg-vyellow px-3 py-1.5 text-xs font-bold uppercase transition-transform hover:-translate-y-0.5"
                    >
                      Re-auction
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
