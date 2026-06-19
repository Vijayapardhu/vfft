import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { AUCTION_HAMMER_SECONDS } from "@/constants/app";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import { patchCurrentAuction } from "@/server/liveState";

export const runtime = "nodejs";

/**
 * Admin "hammer" — starts the final "going once, going twice, SOLD" countdown
 * by setting the deadline to a few seconds out. Works in both modes (in manual
 * mode it's how a lot ever gets a clock). A late bid still extends it via
 * anti-snipe, so the drama can reset — exactly like a real auction.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const auctionId = body?.auctionId;
  if (typeof auctionId !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const seconds =
    typeof body?.seconds === "number" && body.seconds > 0
      ? Math.min(body.seconds, 30)
      : AUCTION_HAMMER_SECONDS;
  const endsAtMs = Date.now() + seconds * 1000;

  const db = adminDb();
  try {
    const auctionRef = db.collection("auctions").doc(auctionId);
    const snap = await auctionRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Auction not found." }, { status: 404 });
    }
    if (snap.data()?.status !== "active") {
      return NextResponse.json({ error: "Auction is not active." }, { status: 400 });
    }

    await auctionRef.update({
      endsAt: new Date(endsAtMs),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await patchCurrentAuction({ endsAt: endsAtMs });

    return NextResponse.json({ ok: true, endsAt: endsAtMs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to hammer." },
      { status: 400 },
    );
  }
}
