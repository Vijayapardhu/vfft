import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import { FRANCHISE_BUDGET } from "@/constants/app";

export const runtime = "nodejs";

/**
 * Admin approves a franchise application.
 * Creates a team document and sets the applicant's role to franchiseOwner.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { applicationId } = body ?? {};
  if (!applicationId) return NextResponse.json({ error: "Missing applicationId." }, { status: 400 });

  const db = adminDb();

  function toSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // Find active season.
  const seasonSnap = await db.collection("seasons").where("active", "==", true).limit(1).get();
  const seasonId = seasonSnap.empty ? "default" : (seasonSnap.docs[0]?.id ?? "default");

  await db.runTransaction(async (tx) => {
    const appRef = db.collection("franchiseApplications").doc(applicationId);
    const appSnap = await tx.get(appRef);
    if (!appSnap.exists) throw new Error("Application not found.");
    const app = appSnap.data()!;
    if (app.status !== "pending" && app.status !== "correction") {
      throw new Error("Application is not in a reviewable state.");
    }

    // Create team document.
    const teamRef = db.collection("teams").doc();
    tx.set(teamRef, {
      seasonId,
      name: app.desiredTeamName,
      slug: toSlug(app.desiredTeamName as string),
      slogan: app.slogan ?? null,
      shortName: app.shortName ?? null,
      logoUrl: app.logoUrl ?? null,
      bannerUrl: null,
      ownerUid: app.applicantUid,
      teamLeaderUid: app.applicantUid,
      primaryColor: app.teamColor ?? null,
      secondaryColor: null,
      purse: FRANCHISE_BUDGET,
      remainingPurse: FRANCHISE_BUDGET,
      squad: [],
      transfersUsed: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Assign franchiseOwner role to the applicant user.
    const userRef = db.collection("users").doc(app.applicantUid);
    tx.update(userRef, {
      role: "franchiseOwner",
      teamId: teamRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Mark application as approved.
    tx.update(appRef, {
      status: "approved",
      teamId: teamRef.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return NextResponse.json({ ok: true });
}
