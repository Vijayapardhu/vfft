import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { generateRoundRobin } from "@/lib/fixtures";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Auto-generate the league fixtures for a season (SRS §10). Round-robin over
 * the season's teams; refuses if league fixtures already exist (delete first).
 * Playoff matches (Q1/Eliminator/Q2/Final) are created manually with the stage
 * selector once standings are known.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId = body?.seasonId;
  // single = 1 cycle, double = 2, triple = 3 (every pair meets that many times).
  const cycles = body?.format === "triple" ? 3 : body?.format === "double" ? 2 : 1;
  const startAt = typeof body?.startAt === "number" ? body.startAt : Date.now();
  const intervalMinutes =
    typeof body?.intervalMinutes === "number" && body.intervalMinutes > 0
      ? body.intervalMinutes
      : 60;
  const map = typeof body?.map === "string" && body.map ? body.map : "Bermuda";

  if (typeof seasonId !== "string") {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const [teamsSnap, matchesSnap] = await Promise.all([
      db.collection("teams").where("seasonId", "==", seasonId).get(),
      db.collection("matches").where("seasonId", "==", seasonId).get(),
    ]);

    const teamIds = teamsSnap.docs.map((d) => d.id);
    if (teamIds.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 teams in the season to generate fixtures." },
        { status: 400 },
      );
    }
    if (matchesSnap.docs.some((d) => d.data().stage === "league")) {
      return NextResponse.json(
        { error: "League fixtures already exist — delete them before regenerating." },
        { status: 400 },
      );
    }

    const pairs = generateRoundRobin(teamIds, cycles);
    const intervalMs = intervalMinutes * 60_000;

    const batch = db.batch();
    pairs.forEach(([team1Id, team2Id], i) => {
      const ref = db.collection("matches").doc();
      batch.set(ref, {
        seasonId,
        matchNumber: i + 1,
        team1Id,
        team2Id,
        map,
        status: "upcoming",
        stage: "league",
        scheduledAt: new Date(startAt + i * intervalMs),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return NextResponse.json({ ok: true, count: pairs.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate fixtures." },
      { status: 400 },
    );
  }
}
