import { NextResponse } from "next/server";
import { settleAuction } from "@/server/auctionSettle";

export const runtime = "nodejs";

/**
 * Auto-close an expired lot — the free-tier replacement for a per-minute cron
 * (Vercel Hobby cron only runs daily). Any client whose countdown hits zero
 * calls this; the SERVER refuses to settle until `endsAt` has actually passed,
 * and the transaction is idempotent, so concurrent calls are harmless. No auth
 * required because the action is fully server-validated and identity-free.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const auctionId = body?.auctionId;
  if (typeof auctionId !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await settleAuction(auctionId, {
      performedBy: "system:auto-expire",
      requireExpired: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    // "not active" / "not expired yet" are expected races — report without 5xx.
    return NextResponse.json(
      { ok: false, reason: e instanceof Error ? e.message : "noop" },
      { status: 200 },
    );
  }
}
