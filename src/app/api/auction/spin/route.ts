import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb, adminRtdb } from "@/server/firebaseAdmin";
import { openAuction } from "@/server/auctionOpen";
import type { AuctionSpinState } from "@/types";

export const runtime = "nodejs";

/** How long the reel rolls before locking onto the winner (ms). */
const SPIN_DURATION_MS = 4200;
/** How long the winner card lingers after the reel locks (must match AuctionSpinner). */
const REVEAL_HOLD_MS = 2400;
/** Max names sent down for the roll (keeps the RTDB payload small). */
const MAX_REEL_NAMES = 60;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Admin "Spin Random Player" — picks a random available player, broadcasts a
 * synchronized slot-machine reveal to every client (RTDB `auction/spin`), AND
 * opens the lot server-side so the player reliably goes up for auction once the
 * reveal finishes. For timed mode the bid clock is delayed past the reveal so no
 * time is lost to the animation. (Previously the admin's browser had to start
 * the lot via a timer, which could silently fail.)
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId = body?.seasonId;
  if (typeof seasonId !== "string" || !seasonId) {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }
  const basePrice = typeof body?.basePrice === "number" && body.basePrice > 0 ? body.basePrice : 1000;
  const mode: "timed" | "manual" = body?.mode === "manual" ? "manual" : "timed";
  const durationSeconds =
    typeof body?.durationSeconds === "number" && body.durationSeconds > 0 ? body.durationSeconds : 30;

  const db = adminDb();

  // Approved players for this season; "available" = not signed to a team. We
  // filter teamId in memory because Firestore can't query for an absent field.
  const snap = await db
    .collection("players")
    .where("seasonId", "==", seasonId)
    .where("status", "==", "approved")
    .get();

  const available = snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter((p) => !p.data.teamId);

  if (available.length === 0) {
    return NextResponse.json(
      { error: "No available players left to auction." },
      { status: 400 },
    );
  }

  const winner = available[Math.floor(Math.random() * available.length)]!;

  // Reel names: shuffle for variety, cap the payload, and make sure the winner
  // is in the list so the lock-on name actually exists in the roll.
  const names = shuffle(
    available.map((p) => (p.data.ign as string) ?? "Player"),
  ).slice(0, MAX_REEL_NAMES);
  const winnerIgn = (winner.data.ign as string) ?? "Player";
  if (!names.includes(winnerIgn)) names[0] = winnerIgn;

  const spin: AuctionSpinState = {
    spinId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    names,
    winnerId: winner.id,
    winnerIgn,
    winnerPhotoURL: (winner.data.photoURL as string | null) ?? null,
    winnerRole: (winner.data.role as string) ?? "",
    startedAt: Date.now(),
    durationMs: SPIN_DURATION_MS,
  };

  try {
    // 1) Broadcast the reveal first so every client starts animating.
    await adminRtdb().ref("auction/spin").set(spin);
    // 2) Open the lot now (covered by the reveal overlay). The timed clock is
    //    delayed past the reveal so bidding opens fresh when it clears.
    const { auctionId } = await openAuction({
      playerId: winner.id,
      seasonId,
      basePrice,
      mode,
      durationSeconds,
      performedBy: admin.uid,
      clockDelayMs: SPIN_DURATION_MS + REVEAL_HOLD_MS,
    });

    return NextResponse.json({
      ok: true,
      auctionId,
      playerId: winner.id,
      ign: winnerIgn,
      startedAt: spin.startedAt,
      durationMs: spin.durationMs,
    });
  } catch (e) {
    // Opening failed — pull the reveal so clients don't show a dead spin.
    await adminRtdb().ref("auction/spin").set(null).catch(() => {});
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to open the lot." },
      { status: 400 },
    );
  }
}
