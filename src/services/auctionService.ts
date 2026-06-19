"use client";

import { apiPost } from "./apiClient";

/** Place a bid (server validates amount/purse/status/ownership). */
export function submitBid(auctionId: string, amount: number) {
  return apiPost<{ ok: true; highestBid: number }>("/api/auction/bid", {
    auctionId,
    amount,
  });
}

/** Admin: put a player up for auction (timed clock or manual control). */
export function startAuction(input: {
  playerId: string;
  seasonId: string;
  basePrice: number;
  mode: "timed" | "manual";
  durationSeconds?: number;
}) {
  return apiPost<{ ok: true; auctionId: string }>("/api/auction/start", input);
}

/** Admin: start the "going once, twice, SOLD" hammer countdown. */
export function hammerAuction(auctionId: string, seconds?: number) {
  return apiPost<{ ok: true; endsAt: number }>("/api/auction/hammer", {
    auctionId,
    seconds,
  });
}

/** Admin: close the current lot (sell to highest bidder or mark unsold). */
export function finalizeAuction(auctionId: string) {
  return apiPost<{ ok: true; status: "sold" | "unsold"; soldPrice?: number }>(
    "/api/auction/finalize",
    { auctionId },
  );
}

/** Admin: wipe the live auction board (RTDB auction/current → null). */
export function clearAuctionBoard() {
  return apiPost<{ ok: true }>("/api/auction/clear", {});
}

/**
 * Fire-and-forget: ask the server to close an expired lot. The server only
 * settles once `endsAt` has passed (and is idempotent), so it's safe for any
 * watching client to call when its countdown hits zero. Errors are ignored.
 */
export function autoExpireAuction(auctionId: string): void {
  void fetch("/api/auction/expire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auctionId }),
  }).catch(() => {});
}
