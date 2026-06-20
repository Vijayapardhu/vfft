import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminRtdb } from "@/server/firebaseAdmin";
import { openAuction } from "@/server/auctionOpen";

export const runtime = "nodejs";

/**
 * Put a player up for auction (admin only). Supersedes any running lot, writes
 * the permanent record to Firestore, and broadcasts the live lot to RTDB.
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

  try {
    const { auctionId } = await openAuction({
      playerId,
      seasonId,
      basePrice,
      mode,
      durationSeconds,
      performedBy: admin.uid,
    });
    // A manual start clears any leftover spin reveal.
    await adminRtdb().ref("auction/spin").set(null);
    return NextResponse.json({ ok: true, auctionId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start auction." },
      { status: 400 },
    );
  }
}
