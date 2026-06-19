import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Admin approves or rejects a submitted lineup (SRS §8). Approval locks it so
 * the team can no longer change it.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const lineupId = body?.lineupId;
  const action = body?.action;
  const reason = typeof body?.reason === "string" ? body.reason : null;
  if (typeof lineupId !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const ref = db.collection("lineups").doc(lineupId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Lineup not found." }, { status: 404 });

    if (action === "approve") {
      await ref.update({
        status: "approved",
        locked: true,
        approvedBy: admin.uid,
        approvedAt: FieldValue.serverTimestamp(),
        rejectedReason: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.update({
        status: "rejected",
        locked: false,
        rejectedReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update lineup." },
      { status: 400 },
    );
  }
}
