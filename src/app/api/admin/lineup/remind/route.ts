import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { remindMatchLineups } from "@/server/lineupReminders";

export const runtime = "nodejs";

/**
 * Admin manually pings both teams in a fixture to submit their lineup. The
 * reliable counterpart to the time-based cron (which may not fire sub-daily on
 * the free hosting tier).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const matchId = body?.matchId;
  if (typeof matchId !== "string") {
    return NextResponse.json({ error: "matchId is required." }, { status: 400 });
  }

  try {
    const { notified } = await remindMatchLineups(matchId);
    return NextResponse.json({ ok: true, notified });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send reminders." },
      { status: 400 },
    );
  }
}
