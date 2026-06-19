import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticate } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/** Authenticated user submits a franchise application. */
export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Sign in to apply." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const required = [
    "fullName", "ign", "phone", "email", "city",
    "desiredTeamName", "slogan", "shortName", "teamColor",
    "motivation", "screenshotUrl",
  ];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  // Only one pending/approved application allowed per user.
  const existing = await adminDb()
    .collection("franchiseApplications")
    .where("applicantUid", "==", user.uid)
    .where("status", "in", ["pending", "approved"])
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json(
      { error: "You already have a pending or approved franchise application." },
      { status: 409 },
    );
  }

  const ref = await adminDb().collection("franchiseApplications").add({
    applicantUid: user.uid,
    fullName: body.fullName,
    ign: body.ign,
    phone: body.phone,
    email: body.email,
    city: body.city,
    desiredTeamName: body.desiredTeamName,
    slogan: body.slogan,
    shortName: body.shortName,
    teamColor: body.teamColor,
    motivation: body.motivation,
    previousExperience: body.previousExperience ?? null,
    instagram: body.instagram ?? null,
    logoUrl: body.logoUrl ?? null,
    bannerIdea: body.bannerIdea ?? null,
    screenshotUrl: body.screenshotUrl,
    feeAmount: body.feeAmount ?? 0,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, applicationId: ref.id });
}
