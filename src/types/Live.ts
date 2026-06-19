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
