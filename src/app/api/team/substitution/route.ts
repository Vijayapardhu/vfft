import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticate } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

const CAN_REQUEST = ["teamLeader", "franchiseOwner", "admin"];

/**
 * Team-leader emergency substitution request (SRS §22). Allowed only before the
 * room starts (match still "upcoming"); both players must be in the squad.
 * Admin approves it later; subs don't count toward the transfer limit.
 */
export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!CAN_REQUEST.includes(user.role) || !user.teamId) {
    return NextResponse.json(
      { error: "Only a team leader or owner can request a substitution." },
      { status: 403 },
    );
  }
  const teamId = user.teamId;

  const body = await req.json().catch(() => null);
  const matchId = body?.matchId;
  const outPlayerId = body?.outPlayerId;
  const inPlayerId = body?.inPlayerId;
  const reason = typeof body?.reason === "string" ? body.reason : "";
  if (
    typeof matchId !== "string" ||
    typeof outPlayerId !== "string" ||
    typeof inPlayerId !== "string" ||
    outPlayerId === inPlayerId
  ) {
    return NextResponse.json({ error: "Pick two different players." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const [matchSnap, teamSnap] = await Promise.all([
      db.collection("matches").doc(matchId).get(),
      db.collection("teams").doc(teamId).get(),
    ]);
    if (!matchSnap.exists) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    if (!teamSnap.exists) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    const match = matchSnap.data() ?? {};
    const team = teamSnap.data() ?? {};
    if (match.team1Id !== teamId && match.team2Id !== teamId) {
      return NextResponse.json({ error: "Your team isn't in this match." }, { status: 403 });
    }
    if (match.status !== "upcoming") {
      return NextResponse.json(
        { error: "Substitutions are only allowed before the room starts." },
        { status: 400 },
      );
    }
    const squad: string[] = team.squad ?? [];
    if (!squad.includes(outPlayerId) || !squad.includes(inPlayerId)) {
      return NextResponse.json(
        { error: "Both players must be in your squad." },
        { status: 400 },
      );
    }

    await db.collection("substitutions").add({
      seasonId: match.seasonId ?? null,
      matchId,
      teamId,
      outPlayerId,
      inPlayerId,
      reason,
      status: "pending",
      requestedBy: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to request substitution." },
      { status: 400 },
    );
  }
}
