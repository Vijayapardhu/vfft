import "server-only";
import type { BidFeedEntry, CurrentAuctionState, SoldEntry } from "@/types";
import { adminRtdb } from "./firebaseAdmin";

export async function setCurrentAuction(state: CurrentAuctionState): Promise<void> {
  await adminRtdb().ref("auction/current").set(state);
}

export async function patchCurrentAuction(
  patch: Partial<CurrentAuctionState>,
): Promise<void> {
  await adminRtdb().ref("auction/current").update(patch);
}

/** Append a bid to the live ticker (append-only; clients cap the list). */
export async function pushBidToFeed(entry: BidFeedEntry): Promise<void> {
  await adminRtdb().ref("auction/feed").push(entry);
}

/** Reset the bid ticker when a new lot opens. */
export async function clearBidFeed(): Promise<void> {
  await adminRtdb().ref("auction/feed").set(null);
}

/** Record a sale on the "recently sold" board (persists across lots). */
export async function pushSold(entry: SoldEntry): Promise<void> {
  await adminRtdb().ref("auction/sold").push(entry);
}

/** Broadcast a match's live state to RTDB `matchState/{matchId}`. */
export async function setMatchState(
  matchId: string,
  state: Record<string, unknown> | null,
): Promise<void> {
  await adminRtdb().ref(`matchState/${matchId}`).set(state);
}

/** Point `matchState/live` at the currently-live match (or null). */
export async function setLiveMatchPointer(matchId: string | null): Promise<void> {
  await adminRtdb().ref("matchState/live").set(matchId);
}

/** Push a live notification to a user's RTDB inbox `notifications/{uid}`. */
export async function pushUserNotification(
  uid: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await adminRtdb().ref(`notifications/${uid}`).push(payload);
}
