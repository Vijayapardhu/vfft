import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { MAX_SQUAD_SIZE, PLAYING_SQUAD_SIZE } from "@/constants/app";
import { lineupWindow } from "@/lib/lineup";
import { authenticate } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

const CAN_SUBMIT = ["teamLeader", "franchiseOwner", "admin"];

/**
 * Team-leader match-day lineup submission (SRS §8). Server validates that the
 * caller leads a team in the fixture and that the playing four belong to the
 * squad; saves a pending lineup. Locked lineups can't be resubmitted.
 */
export async function POST(req: Request) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!CAN_SUBMIT.includes(user.role) || !user.teamId) {
    return NextResponse.json(
      { error: "Only a team leader or owner can submit a lineup." },
      { status: 403 },
    );
  }
  const teamId = user.teamId;

  const body = await req.json().catch(() => null);
  const matchId = body?.matchId;
  const playingFour = body?.playingFour;
  const captainId = body?.captainId;
  const viceCaptainId = body?.viceCaptainId;

  // Shape validation; the EXACT count is checked against the match's team size
  // once the match is loaded (admin-configurable room size).
  if (
    typeof matchId !== "string" ||
    !Array.isArray(playingFour) ||
    playingFour.length < 1 ||
    playingFour.length > MAX_SQUAD_SIZE ||
    !playingFour.every((p) => typeof p === "string") ||
    typeof captainId !== "string" ||
    typeof viceCaptainId !== "string"
  ) {
    return NextResponse.json({ error: "Invalid lineup." }, { status: 400 });
  }
  if (new Set(playingFour).size !== playingFour.length) {
    return NextResponse.json({ error: "Pick different players." }, { status: 400 });
  }
  if (
    !playingFour.includes(captainId) ||
    !playingFour.includes(viceCaptainId) ||
    captainId === viceCaptainId
  ) {
    return NextResponse.json(
      { error: "Captain and vice-captain must be two different players from the lineup." },
      { status: 400 },
    );
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
    // The lineup window closes at kickoff (and once the match goes live/done).
    const kickoffMs = match.scheduledAt?.toMillis?.() ?? null;
    if (lineupWindow(kickoffMs, match.status ?? "upcoming", Date.now()).isClosed) {
      return NextResponse.json(
        { error: "Lineup submissions are closed — the match has started." },
        { status: 400 },
      );
    }
    // Exactly the room size configured for this match must be picked.
    const teamSize =
      typeof match.teamSize === "number" && match.teamSize > 0
        ? match.teamSize
        : PLAYING_SQUAD_SIZE;
    if (playingFour.length !== teamSize) {
      return NextResponse.json(
        { error: `Pick exactly ${teamSize} player(s) for this match.` },
        { status: 400 },
      );
    }
    const squad: string[] = team.squad ?? [];
    if (!playingFour.every((p) => squad.includes(p))) {
      return NextResponse.json(
        { error: "Every player must be in your squad." },
        { status: 400 },
      );
    }

    const lineupId = `${matchId}_${teamId}`;
    const ref = db.collection("lineups").doc(lineupId);
    const existing = await ref.get();
    if (existing.exists && existing.data()?.locked) {
      return NextResponse.json(
        { error: "Lineup is locked — it's already approved." },
        { status: 400 },
      );
    }

    await ref.set(
      {
        seasonId: match.seasonId ?? null,
        matchId,
        teamId,
        playingFour,
        captainId,
        viceCaptainId,
        status: "pending",
        locked: false,
        submittedBy: user.uid,
        submittedAt: FieldValue.serverTimestamp(),
        createdAt: existing.exists
          ? (existing.data()?.createdAt ?? FieldValue.serverTimestamp())
          : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true, lineupId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to submit lineup." },
      { status: 400 },
    );
  }
}
