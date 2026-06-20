import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { stopActiveAuctions } from "@/server/auctionStop";

export const runtime = "nodejs";

/**
 * Admin: clear/skip the current lot. Cancels any active Firestore auction
 * (marks it unsold — no sale) AND wipes the RTDB live board + feed, so the
 * board shows "no lot" and a fresh auction can be started immediately.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const stopped = await stopActiveAuctions({ performedBy: admin.uid });

  return NextResponse.json({ ok: true, stopped });
}
