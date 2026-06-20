import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { clearBidFeed, setCurrentAuction } from "./liveState";

export interface OpenAuctionInput {
  playerId: string;
  seasonId: string;
  basePrice: number;
  mode: "timed" | "manual";
  durationSeconds: number;
  performedBy: string;
  /**
   * Delay (ms) before a timed clock actually starts. Used by the spin flow so
   * the bid countdown only begins once the slot-machine reveal has finished.
   */
  clockDelayMs?: number;
}

export interface OpenAuctionResult {
  auctionId: string;
  endsAtMs: number | null;
}

/**
 * Open a lot for a player — the single, server-authoritative path used by both
 * the manual "Start" and the "Spin random" flows. In one transaction it
 * validates the player, AUTO-STOPS any running lot for the season (marks it
 * unsold — no sale/no purse change), and creates the new active auction. Then it
 * broadcasts the live lot to RTDB and resets the bid feed.
 */
export async function openAuction(input: OpenAuctionInput): Promise<OpenAuctionResult> {
  const { playerId, seasonId, basePrice, mode, durationSeconds, performedBy } = input;
  const db = adminDb();
  const clockDelayMs = input.clockDelayMs ?? 0;

  // Timed lots get a live clock (optionally delayed past a reveal); manual lots
  // have no clock until the admin hammers.
  const endsAtMs: number | null =
    mode === "timed" ? Date.now() + clockDelayMs + durationSeconds * 1000 : null;

  const result = await db.runTransaction(async (tx) => {
    const playerRef = db.collection("players").doc(playerId);
    const playerSnap = await tx.get(playerRef);
    if (!playerSnap.exists) throw new Error("Player not found.");
    const player = playerSnap.data() ?? {};
    if (player.status !== "approved") throw new Error("Player is not approved.");
    if (player.teamId) throw new Error("Player is already signed to a team.");

    // Supersede any running lot for this season.
    const activeSnap = await tx.get(
      db.collection("auctions").where("status", "==", "active").limit(20),
    );
    for (const d of activeSnap.docs) {
      if (d.data().seasonId === seasonId) {
        tx.update(d.ref, { status: "unsold", updatedAt: FieldValue.serverTimestamp() });
      }
    }

    const auctionRef = db.collection("auctions").doc();
    tx.set(auctionRef, {
      seasonId,
      playerId,
      mode,
      basePrice,
      highestBid: 0,
      status: "active",
      startedAt: FieldValue.serverTimestamp(),
      endsAt: endsAtMs ? new Date(endsAtMs) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      auctionId: auctionRef.id,
      playerIgn: (player.ign as string) ?? "Player",
      playerPhotoURL: (player.photoURL as string | null) ?? null,
      playerRole: (player.role as string) ?? "",
    };
  });

  await setCurrentAuction({
    auctionId: result.auctionId,
    playerId,
    playerIgn: result.playerIgn,
    playerPhotoURL: result.playerPhotoURL,
    playerRole: result.playerRole,
    mode,
    basePrice,
    currentBid: 0,
    highestTeamId: null,
    highestTeamName: null,
    status: "active",
    endsAt: endsAtMs,
  });
  await clearBidFeed();

  // performedBy is reserved for an audit trail; referenced to keep the param
  // meaningful for callers and future logging.
  void performedBy;

  return { auctionId: result.auctionId, endsAtMs };
}
