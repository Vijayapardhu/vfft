import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { applicationId, reason, action } = body ?? {};
  if (!applicationId) return NextResponse.json({ error: "Missing applicationId." }, { status: 400 });

  const db = adminDb();
  const ref = db.collection("franchiseApplications").doc(applicationId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // action = "reject" | "correction"
  const newStatus = action === "correction" ? "correction" : "rejected";

  await ref.update({
    status: newStatus,
    ...(newStatus === "rejected" ? { rejectedReason: reason ?? "No reason given." } : {}),
    ...(newStatus === "correction" ? { correctionNote: reason ?? "" } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
