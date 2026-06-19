import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Approve or reject a player registration (SRS §4). Approval atomically sets the
 * player status AND promotes the owning account to the "player" role (only from
 * "guest", so it never demotes an admin/leader who also registered).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const playerId = body?.playerId;
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason : null;
  if (typeof playerId !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const playerRef = db.collection("players").doc(playerId);
    const snap = await playerRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    const player = snap.data() ?? {};

    const batch = db.batch();
    if (action === "approve") {
      batch.update(playerRef, {
        status: "approved",
        approvedBy: admin.uid,
        approvedAt: FieldValue.serverTimestamp(),
        rejectedReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (player.uid) {
        const userSnap = await db.collection("users").doc(player.uid).get();
        const currentRole = userSnap.data()?.role;
        // Link the profile + promote guests; don't demote elevated roles.
        batch.update(db.collection("users").doc(player.uid), {
          playerId,
          ...(currentRole === "guest" || currentRole === undefined
            ? { role: "player" }
            : {}),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      batch.update(playerRef, {
        status: "rejected",
        rejectedReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update player." },
      { status: 400 },
    );
  }
}
