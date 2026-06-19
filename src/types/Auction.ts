import type { AuctionStatus, Timestamp, Timestamps } from "./common";

/**
 * `auctions/{auctionId}` — one player on the block (SRS §6).
 * Server-authoritative: `highestBid`, `soldPrice`, `soldTeamId` and `status`
 * are written ONLY by Cloud Functions inside Firestore transactions (TRD §15).
 */
export interface Auction extends Timestamps {
  seasonId: string;
  playerId: string;

  /** "timed" runs an auto-closing clock; "manual" is admin-driven (no clock until hammered). */
  mode: "timed" | "manual";

  basePrice: number;
  highestBid: number;
  highestBidTeamId?: string;

  soldPrice?: number;
  soldTeamId?: string;

  status: AuctionStatus;

  /** Countdown end (server-set). */
  endsAt?: Timestamp;
  startedAt?: Timestamp;
}

/**
 * `bids/{bidId}` — an immutable bid record. Clients may only call the
 * `submitBid` Cloud Function; they never write this collection directly.
 */
export interface Bid extends Timestamps {
  seasonId: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  bidByUid: string;
}
