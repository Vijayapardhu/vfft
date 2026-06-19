import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import { setLiveMatchPointer, setMatchState } from "@/server/liveState";
import { broadcastNotification } from "@/server/notify";

export const runtime = "nodejs";

/**
 * Set a match's status (upcoming/live/completed) and broadcast it to RTDB so
 * the live match center updates instantly. Clients can't write RTDB matchState
 * (rules), so this is the way to drive the "LIVE" experience.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const matchId = body?.matchId;
  const status = body?.status;
  if (
    typeof matchId !== "string" ||
    !["upcoming", "live", "completed"].includes(status)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const ref = db.collection("matches").doc(matchId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    const m = snap.data() ?? {};

    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });

    await setMatchState(matchId, {
      matchId,
      team1Id: m.team1Id ?? null,
      team2Id: m.team2Id ?? null,
      map: m.map ?? null,
      matchNumber: m.matchNumber ?? null,
      status,
      updatedAt: Date.now(),
    });
    if (status === "live") {
      await setLiveMatchPointer(matchId);
    } else if (status === "completed") {
      await setLiveMatchPointer(null);
    }

    // Announce a match going LIVE to everyone (best-effort).
    if (status === "live") {
      const label = m.name || `Match #${m.matchNumber ?? "?"}`;
      try {
        await broadcastNotification({
          type: "scheduleChange",
          title: `${label} is LIVE`,
          body: "The match has started — tap to watch.",
          href: `/matches/${matchId}`,
        });
      } catch {
        // Notification failure must not block the state change.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update match state." },
      { status: 400 },
    );
  }
}
