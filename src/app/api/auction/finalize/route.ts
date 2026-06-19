import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { settleAuction } from "@/server/auctionSettle";

export const runtime = "nodejs";

/** Admin force-closes the current lot (any time) — sells or marks unsold. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const auctionId = body?.auctionId;
  if (typeof auctionId !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await settleAuction(auctionId, {
      performedBy: admin.uid,
      requireExpired: false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to finalize auction." },
      { status: 400 },
    );
  }
}
