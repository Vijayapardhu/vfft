/**
 * Realtime Database "live engine" shapes (read by clients via onValue,
 * written only by the server via the Admin SDK).
 */

/** RTDB `auction/current` — the live auction lot. */
export interface CurrentAuctionState {
  auctionId: string;
  playerId: string;
  playerIgn: string;
  playerPhotoURL: string | null;
  playerRole: string;
  mode: "timed" | "manual";
  basePrice: number;
  currentBid: number;
  highestTeamId: string | null;
  highestTeamName: string | null;
  status: "active" | "sold" | "unsold";
  /** Epoch milliseconds — null in manual mode until the admin hammers. */
  endsAt: number | null;
  soldPrice?: number;
}

/** RTDB `auction/feed/*` — live bid ticker for the current lot. */
export interface BidFeedEntry {
  teamId: string;
  teamName: string;
  amount: number;
  ts: number;
}

/** RTDB `auction/sold/*` — recently sold players this auction session. */
export interface SoldEntry {
  playerId: string;
  ign: string;
  teamName: string;
  price: number;
  ts: number;
}

/**
 * RTDB `auction/spin` — the synchronized "random player" slot-machine reveal.
 * The server picks the winner and stamps `startedAt`; every client reads the
 * same node and animates the roll to land on the winner at the same instant.
 */
export interface AuctionSpinState {
  /** Unique per spin so clients only animate a fresh roll once. */
  spinId: string;
  /** Names rolled through during the animation (display only). */
  names: string[];
  /** The chosen player. */
  winnerId: string;
  winnerIgn: string;
  winnerPhotoURL: string | null;
  winnerRole: string;
  /** Epoch ms when the roll began (server clock). */
  startedAt: number;
  /** How long the reel rolls before locking on the winner (ms). */
  durationMs: number;
}
