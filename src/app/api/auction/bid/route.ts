import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { AUCTION_BID_EXTEND_SECONDS, MAX_SQUAD_SIZE } from "@/constants/app";
import { authenticate } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import { patchCurrentAuction, pushBidToFeed } from "@/server/liveState";

export const runtime = "nodejs";

const CAN_BID = ["teamLeader", "franchiseOwner"];
const EXTEND_MS = AUCTION_BID_EXTEND_SECONDS * 1000;

/**
 * Place a bid (TRD §15). The client only sends {auctionId, amount}; the server
 * validates status/amount/purse/ownership in a transaction, updates the highest
 * bid, and applies anti-snipe (a bid in the final window pushes the clock back).
 */
export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!CAN_BID.includes(user.role) || !user.teamId) {
    return NextResponse.json(
      { error: "Only a team leader or franchise owner can bid." },
      { status: 403 },
    );
  }
  const teamId = user.teamId;

  const body = await req.json().catch(() => null);
  const auctionId = body?.auctionId;
  const amount = body?.amount;
  if (
    typeof auctionId !== "string" ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return NextResponse.json({ error: "Invalid bid." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const result = await db.runTransaction(async (tx) => {
      const auctionRef = db.collection("auctions").doc(auctionId);
      const teamRef = db.collection("teams").doc(teamId);
      const [auctionSnap, teamSnap] = await Promise.all([
        tx.get(auctionRef),
        tx.get(teamRef),
      ]);
      if (!auctionSnap.exists) throw new Error("Auction not found.");
      if (!teamSnap.exists) throw new Error("Team not found.");

      const auction = auctionSnap.data() ?? {};
      const team = teamSnap.data() ?? {};

      if (auction.status !== "active") throw new Error("This auction is not active.");
      if (auction.highestBidTeamId === teamId) {
        throw new Error("You already hold the highest bid.");
      }
      if ((team.squad?.length ?? 0) >= MAX_SQUAD_SIZE) {
        throw new Error("Your squad is already full.");
      }
      const minBid = Math.max(auction.basePrice ?? 0, (auction.highestBid ?? 0) + 1);
      if (amount < minBid) throw new Error(`Bid must be at least ${minBid} coins.`);
      if (amount > (team.remainingPurse ?? 0)) {
        throw new Error("Bid exceeds your remaining purse.");
      }

      // Anti-snipe: only extends a running clock; leaves manual lots (no clock) untouched.
      const currentEndsMs: number | null = auction.endsAt?.toMillis?.() ?? null;
      let newEndsMs: number | null = currentEndsMs;
      if (currentEndsMs !== null && currentEndsMs - Date.now() < EXTEND_MS) {
        newEndsMs = Date.now() + EXTEND_MS;
      }

      const bidRef = db.collection("bids").doc();
      tx.set(bidRef, {
        seasonId: auction.seasonId ?? null,
        auctionId,
        playerId: auction.playerId,
        teamId,
        amount,
        bidByUid: user.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(auctionRef, {
        highestBid: amount,
        highestBidTeamId: teamId,
        updatedAt: FieldValue.serverTimestamp(),
        ...(newEndsMs !== currentEndsMs ? { endsAt: new Date(newEndsMs as number) } : {}),
      });
      return {
        highestBid: amount,
        teamName: (team.name as string) ?? "",
        endsAtMs: newEndsMs,
        endsChanged: newEndsMs !== currentEndsMs,
      };
    });

    await patchCurrentAuction({
      currentBid: result.highestBid,
      highestTeamId: teamId,
      highestTeamName: result.teamName,
      ...(result.endsChanged ? { endsAt: result.endsAtMs } : {}),
    });
    await pushBidToFeed({
      teamId,
      teamName: result.teamName,
      amount: result.highestBid,
      ts: Date.now(),
    });

    return NextResponse.json({ ok: true, highestBid: result.highestBid });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bid failed." },
      { status: 400 },
    );
  }
}
