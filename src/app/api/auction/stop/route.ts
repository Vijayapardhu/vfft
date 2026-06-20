import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { stopActiveAuctions } from "@/server/auctionStop";

export const runtime = "nodejs";

/**
 * Admin "Stop Auction" — fully ends the live lot: cancels the active Firestore
 * auction doc (marks it unsold, no sale, no purse change) AND clears the RTDB
 * live board. After this the lot is truly stopped and a new one can be started.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const auctionId = typeof body?.auctionId === "string" ? body.auctionId : undefined;
  const seasonId = typeof body?.seasonId === "string" ? body.seasonId : undefined;

  try {
    const stopped = await stopActiveAuctions({
      auctionId,
      seasonId,
      performedBy: admin.uid,
    });
    return NextResponse.json({ ok: true, stopped });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to stop auction." },
      { status: 400 },
    );
  }
}
