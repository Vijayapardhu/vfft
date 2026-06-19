"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRealtimeAuction } from "@/hooks/useRealtimeAuction";
import { usePlayers } from "@/hooks/usePlayers";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useSoldBoard } from "@/hooks/useAuction";
import { useCollectionData } from "@/hooks/useFirestore";
import { db } from "@/firebase/firestore";
import { COLLECTIONS } from "@/firebase/collections";
import { Gavel, Pause, Trophy, XCircle, RefreshCw, Timer, Users, Hammer, CheckCircle } from "lucide-react";
import { auth } from "@/firebase/auth";

export default function AdminAuctionPage() {
  const { auction, loading: auctionLoading } = useRealtimeAuction();
  const { data: players } = usePlayers();
  const { seasonId } = useActiveSeason();
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [basePrice, setBasePrice] = useState(1000);
  const [mode, setMode] = useState<"manual" | "timed">("manual");
  const [saving, setSaving] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auction?.endsAt) { setSecondsLeft(0); return; }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((auction.endsAt! - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [auction?.endsAt, auction?.auctionId]);

  const unsoldPlayers = players.filter((p) => p.teamId == null && p.status === "approved");

  const soldEntries = useSoldBoard();
  const unsoldQuery = useMemo(
    () => seasonId ? query(collection(db, COLLECTIONS.auctions), where("seasonId", "==", seasonId), where("status", "==", "unsold"), orderBy("updatedAt", "desc"), limit(20)) : null,
    [seasonId],
  );
  const { data: unsoldAuctions } = useCollectionData(unsoldQuery, [seasonId]);

  async function handleStartAuction() {
    if (!selectedPlayer || !seasonId) return;
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/auction/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ playerId: selectedPlayer, seasonId, basePrice, mode }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to start auction");
        return;
      }
      setShowStartForm(false);
      setSelectedPlayer("");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!auction?.auctionId) return;
    setSaving(true);
    setResultMsg(null);
    try {
      const t = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/auction/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ auctionId: auction.auctionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to finalize auction");
        return;
      }
      const data = await res.json();
      if (data.status === "sold") {
        setResultMsg(`Sold! ${data.ign ?? "Player"} → ${data.teamName ?? "—"} for ${(data.soldPrice ?? 0).toLocaleString()} coins`);
      } else {
        setResultMsg("No bids — marked as unsold");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleHammer() {
    if (!auction?.auctionId) return;
    setSaving(true);
    setResultMsg(null);
    try {
      const t = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/auction/hammer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ auctionId: auction.auctionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Failed to close bidding");
      }
    } finally {
      setSaving(false);
    }
  }

  if (auctionLoading) return <Spinner />;

  return (
    <div>
      <AdminHeader
        title="Auction"
        subtitle="Manage player auctions"
        action={
          <Button variant="yellow" size="sm" onClick={() => setShowStartForm(!showStartForm)}>
            <Gavel className="h-4 w-4" /> Start Auction
          </Button>
        }
      />

      {showStartForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start New Auction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Player</Label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium"
                >
                  <option value="">Select player</option>
                  {unsoldPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.ign} ({p.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Base Price</Label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium"
                />
              </div>
              <div>
                <Label>Mode</Label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as "manual" | "timed")}
                  className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-2 font-medium"
                >
                  <option value="manual">Manual</option>
                  <option value="timed">Timed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="cream" onClick={() => setShowStartForm(false)}>Cancel</Button>
              <Button variant="yellow" onClick={handleStartAuction} disabled={!selectedPlayer || saving}>
                <Gavel className="h-4 w-4" /> Start
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {auction ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-vred" />
                Current Auction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={auction.playerPhoto || "/placeholder-player.svg"}
                  alt={auction.playerName}
                  className="h-20 w-20 rounded-2xl border-4 border-ink object-cover"
                />
                <div>
                  <h3 className="truncate text-2xl font-bold">{auction.playerName}</h3>
                  <Badge variant="blue">{auction.status}</Badge>
                  <p className="mt-1 text-sm font-medium text-ink/60">
                    Base: ₹{auction.basePrice}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border-4 border-ink bg-vyellow p-4">
                <p className="text-sm font-bold uppercase text-ink/60">Current Bid</p>
                <p className="text-3xl font-bold">₹{auction.currentBid}</p>
                <p className="text-sm font-medium">
                  {auction.highestBidTeamName ? `by ${auction.highestBidTeamName}` : ""}
                </p>
              </div>

              {secondsLeft > 0 && (
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Timer className="h-5 w-5 text-vred" />
                    {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, "0")}
                  </div>
                )}

              <div className="flex flex-wrap gap-2">
                <Button variant="yellow" onClick={handleHammer} disabled={saving}>
                  <Hammer className="h-4 w-4" /> Close Bidding
                </Button>
                <Button variant="green" onClick={handleFinalize} disabled={saving}>
                  <CheckCircle className="h-4 w-4" /> Settle Now
                </Button>
              </div>

              {resultMsg && (
                <div className="rounded-2xl border-4 border-ink bg-vyellow p-3 text-sm font-bold">
                  {resultMsg}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Bid Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-ink/60">Bid history will appear here in real time.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Gavel className="mx-auto mb-4 h-12 w-12 text-ink/30" />
            <p className="text-lg font-bold">No Active Auction</p>
            <p className="text-sm font-medium text-ink/60">Start a new auction to begin bidding.</p>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-4 mt-8 text-xl font-bold uppercase tracking-tight">History</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-vgreen" /> Sold Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {soldEntries.length === 0 ? (
              <p className="text-sm font-medium text-ink/60">No players sold yet.</p>
            ) : (
              soldEntries.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border-2 border-ink/20 bg-cream p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{e.ign}</p>
                    <p className="truncate text-xs font-medium text-ink/60">→ {e.teamName}</p>
                  </div>
                  <Badge variant="green">{e.price.toLocaleString()} coins</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><XCircle className="h-4 w-4 text-vred" /> Unsold Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unsoldAuctions.length === 0 ? (
              <p className="text-sm font-medium text-ink/60">No unsold players yet.</p>
            ) : (
              unsoldAuctions.map((a) => {
                const data = a as unknown as { playerId: string; basePrice: number };
                const p = players.find((pl) => pl.id === data.playerId);
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border-2 border-ink/20 bg-cream p-3">
                    <p className="truncate font-bold">{p?.ign ?? "Unknown"}</p>
                    <Badge variant="red">{data.basePrice.toLocaleString()} coins</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
