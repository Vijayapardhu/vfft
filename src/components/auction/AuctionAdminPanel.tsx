"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { AUCTION_COUNTDOWN_SECONDS } from "@/constants/app";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { usePlayers } from "@/hooks/usePlayers";
import {
  finalizeAuction,
  hammerAuction,
  startAuction,
} from "@/services/auctionService";
import type { CurrentAuctionState } from "@/types";

export function AuctionAdminPanel({
  auction,
}: {
  auction: CurrentAuctionState | null;
}) {
  const { seasonId } = useActiveSeason();
  const { data: players } = usePlayers();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerId, setPlayerId] = useState("");
  const [basePrice, setBasePrice] = useState(100);
  const [mode, setMode] = useState<"timed" | "manual">("timed");
  const [duration, setDuration] = useState(AUCTION_COUNTDOWN_SECONDS);

  const activeAuction = auction?.status === "active" ? auction : null;
  const available = players.filter((p) => p.status === "approved" && !p.teamId);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-3xl border-4 border-dashed border-ink/40 bg-cream p-5">
      <h2 className="mb-3 text-lg font-bold uppercase">🎙️ Run the Auction</h2>

      {activeAuction ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink/60">
            Bidding is live. Press <strong>Hammer</strong> to start the 3·2·1
            countdown, or close the lot right now.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="yellow"
              disabled={busy}
              onClick={() => run(() => hammerAuction(activeAuction.auctionId))}
            >
              🔨 Hammer (3·2·1)
            </Button>
            <Button
              variant={activeAuction.currentBid > 0 ? "green" : "red"}
              disabled={busy}
              onClick={() => run(() => finalizeAuction(activeAuction.auctionId))}
            >
              {activeAuction.currentBid > 0 ? "Sold Now" : "Mark Unsold"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {auction?.status === "unsold" && (
            <div className="rounded-2xl border-2 border-ink bg-vred/20 p-3">
              <p className="mb-2 text-sm font-bold">
                {auction.playerIgn} went unsold — back in the pool.
              </p>
              <Button
                variant="yellow"
                disabled={busy || !seasonId}
                onClick={() =>
                  run(() =>
                    startAuction({
                      playerId: auction.playerId,
                      seasonId: seasonId as string,
                      basePrice: auction.basePrice,
                      mode: "timed",
                      durationSeconds: AUCTION_COUNTDOWN_SECONDS,
                    }),
                  )
                }
              >
                Re-auction {auction.playerIgn}
              </Button>
            </div>
          )}
          {!seasonId && (
            <p className="text-sm font-bold text-vred">
              No active season — create one before running the auction.
            </p>
          )}
          <div>
            <Label htmlFor="ap-player">1 · Pick a player</Label>
            <Select
              id="ap-player"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
            >
              <option value="">Choose an approved, unsigned player…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ign}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ap-base">2 · Base price (coins)</Label>
              <Input
                id="ap-base"
                type="number"
                min={1}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="ap-mode">3 · Timer or manual</Label>
              <Select
                id="ap-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "timed" | "manual")}
              >
                <option value="timed">Timed clock (auto-closes)</option>
                <option value="manual">Manual (I&apos;ll hammer it)</option>
              </Select>
            </div>
          </div>
          {mode === "timed" && (
            <div>
              <Label htmlFor="ap-dur">Timer length (seconds)</Label>
              <Input
                id="ap-dur"
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          )}
          <Button
            variant="ink"
            size="lg"
            className="w-full"
            disabled={busy || !playerId || !seasonId || basePrice <= 0}
            onClick={() =>
              run(() =>
                startAuction({
                  playerId,
                  seasonId: seasonId as string,
                  basePrice,
                  mode,
                  durationSeconds: duration,
                }),
              )
            }
          >
            ▶ Start Bidding
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm font-bold text-vred">{error}</p>}
    </div>
  );
}
