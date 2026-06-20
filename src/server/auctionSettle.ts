import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { AUCTION_SETTLE_GRACE_SECONDS } from "@/constants/app";
import { adminDb } from "./firebaseAdmin";
import { patchCurrentAuction, pushSold } from "./liveState";
import { squadCapFrom } from "./squadCap";

const SETTLE_GRACE_MS = AUCTION_SETTLE_GRACE_SECONDS * 1000;

export interface SettleResult {
  status: "sold" | "unsold";
  soldPrice?: number;
  soldTeamId?: string;
  playerId?: string;
  ign?: string;
  teamName?: string;
}

/**
 * Close an auction lot in a single Firestore transaction (TRD §15/§16):
 * sell to the highest bidder (deduct purse, add to squad, audit) or mark unsold,
 * then broadcast the outcome to RTDB.
 *
 * @param requireExpired when true, refuses to settle until `endsAt` has passed.
 *   This is what makes the client-triggered auto-close safe — the deadline is
 *   enforced on the SERVER, so a client can never close a lot early.
 */
export async function settleAuction(
  auctionId: string,
  opts: { performedBy: string; requireExpired: boolean },
): Promise<SettleResult> {
  const db = adminDb();

  const result = await db.runTransaction<SettleResult>(async (tx) => {
    const auctionRef = db.collection("auctions").doc(auctionId);
    const auctionSnap = await tx.get(auctionRef);
    if (!auctionSnap.exists) throw new Error("Auction not found.");
    const auction = auctionSnap.data() ?? {};
    if (auction.status !== "active") throw new Error("Auction is not active.");

    if (opts.requireExpired) {
      const endsAtMs: number = auction.endsAt?.toMillis?.() ?? 0;
      // Grace buffer: a last-second bid arrives just after the on-screen "0" due
      // to latency. Holding off the auto-close by SETTLE_GRACE_MS lets that bid
      // commit (and reset the clock via anti-snipe) instead of losing the race
      // to the auto-close and being rejected as "not active".
      if (!endsAtMs || endsAtMs + SETTLE_GRACE_MS > Date.now()) {
        throw new Error("Auction has not expired yet.");
      }
    }

    // No bids → unsold.
    if (!auction.highestBidTeamId || !auction.highestBid) {
      tx.update(auctionRef, {
        status: "unsold",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { status: "unsold" };
    }

    const soldPrice: number = auction.highestBid;
    const soldTeamId: string = auction.highestBidTeamId;
    const teamRef = db.collection("teams").doc(soldTeamId);
    const playerRef = db.collection("players").doc(auction.playerId);
    const seasonRef = auction.seasonId ? db.collection("seasons").doc(auction.seasonId) : null;
    const [teamSnap, playerSnap, seasonSnap] = await Promise.all([
      tx.get(teamRef),
      tx.get(playerRef),
      seasonRef ? tx.get(seasonRef) : Promise.resolve(null),
    ]);
    if (!teamSnap.exists) throw new Error("Winning team not found.");
    if (!playerSnap.exists) throw new Error("Player not found.");

    const team = teamSnap.data() ?? {};
    const player = playerSnap.data() ?? {};
    const remaining: number = team.remainingPurse ?? 0;
    const squad: string[] = team.squad ?? [];
    const cap = squadCapFrom(seasonSnap?.data());
    if (remaining < soldPrice) throw new Error("Winning team has insufficient purse.");
    if (squad.length >= cap) throw new Error("Winning team's squad is full.");

    tx.update(auctionRef, {
      status: "sold",
      soldPrice,
      soldTeamId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(playerRef, {
      teamId: soldTeamId,
      soldPrice,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(teamRef, {
      remainingPurse: remaining - soldPrice,
      squad: FieldValue.arrayUnion(auction.playerId),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection("auditLogs").doc(), {
      action: "auction.sold",
      entityType: "player",
      entityId: auction.playerId,
      performedBy: opts.performedBy,
      timestamp: FieldValue.serverTimestamp(),
      beforeState: { remainingPurse: remaining },
      afterState: { remainingPurse: remaining - soldPrice, soldPrice },
    });
    return {
      status: "sold",
      soldPrice,
      soldTeamId,
      playerId: auction.playerId,
      ign: (player.ign as string) ?? "Player",
      teamName: (team.name as string) ?? "",
    };
  });

  if (result.status === "sold") {
    await patchCurrentAuction({
      status: "sold",
      soldPrice: result.soldPrice,
      highestTeamId: result.soldTeamId,
    });
    await pushSold({
      playerId: result.playerId ?? "",
      ign: result.ign ?? "Player",
      teamName: result.teamName ?? "",
      price: result.soldPrice ?? 0,
      ts: Date.now(),
    });
  } else {
    await patchCurrentAuction({ status: "unsold" });
  }
  return result;
}
