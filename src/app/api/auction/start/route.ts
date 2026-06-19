import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import { clearBidFeed, setCurrentAuction } from "@/server/liveState";

export const runtime = "nodejs";

/**
 * Put a player up for auction (admin only). Writes the permanent record to
 * Firestore and broadcasts the live lot to RTDB `auction/current`.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const playerId = body?.playerId;
  const seasonId = body?.seasonId;
  const basePrice = body?.basePrice;
  const mode: "timed" | "manual" = body?.mode === "manual" ? "manual" : "timed";
  const durationSeconds =
    typeof body?.durationSeconds === "number" ? body.durationSeconds : 30;

  if (
    typeof playerId !== "string" ||
    typeof seasonId !== "string" ||
    typeof basePrice !== "number" ||
    basePrice <= 0
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  // Timed lots get a live clock; manual lots have no clock until the admin hammers.
  const endsAtMs: number | null =
    mode === "timed" ? Date.now() + durationSeconds * 1000 : null;

  try {
    const result = await db.runTransaction(async (tx) => {
      const playerRef = db.collection("players").doc(playerId);
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists) throw new Error("Player not found.");
      const player = playerSnap.data() ?? {};
      if (player.status !== "approved") throw new Error("Player is not approved.");
      if (player.teamId) throw new Error("Player is already signed to a team.");

      const activeSnap = await tx.get(
        db.collection("auctions").where("status", "==", "active").limit(5),
      );
      if (activeSnap.docs.some((d) => d.data().seasonId === seasonId)) {
        throw new Error("Another auction is already active.");
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

    return NextResponse.json({ ok: true, auctionId: result.auctionId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start auction." },
      { status: 400 },
    );
  }
}
