import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

interface StatRow {
  playerId: string;
  kills: number;
  headshots: number;
  damage: number;
  mvpAwards: number;
  matchesPlayed: number;
}

/**
 * Recompute & award season achievements (SRS §20) from playerSeasonStats +
 * the season doc. Idempotent: deterministic ids mean re-running just upserts.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId = body?.seasonId;
  if (typeof seasonId !== "string") {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const db = adminDb();
  try {
    const [seasonSnap, statsSnap] = await Promise.all([
      db.collection("seasons").doc(seasonId).get(),
      db.collection("playerSeasonStats").where("seasonId", "==", seasonId).get(),
    ]);
    const season = seasonSnap.data() ?? {};
    const rows: StatRow[] = statsSnap.docs.map((d) => {
      const s = d.data();
      return {
        playerId: s.playerId,
        kills: s.kills ?? 0,
        headshots: s.headshots ?? 0,
        damage: s.damage ?? 0,
        mvpAwards: s.mvpAwards ?? 0,
        matchesPlayed: s.matchesPlayed ?? 0,
      };
    });

    const awards = new Set<string>(); // `${playerId}::${type}`
    const give = (playerId: string | undefined, type: string) => {
      if (playerId) awards.add(`${playerId}::${type}`);
    };
    const topBy = (key: "kills" | "headshots" | "damage") =>
      rows.length
        ? rows.reduce((a, b) => (b[key] > a[key] ? b : a))
        : null;

    const km = topBy("kills");
    if (km && km.kills > 0) give(km.playerId, "killMachine");
    const sk = topBy("headshots");
    if (sk && sk.headshots > 0) give(sk.playerId, "sniperKing");
    const tm = topBy("damage");
    if (tm && tm.damage > 0) give(tm.playerId, "terminator");

    if (season.mvpPlayerId) give(season.mvpPlayerId as string, "mvp");

    if (season.championTeamId) {
      const teamSnap = await db.collection("teams").doc(season.championTeamId).get();
      const squad: string[] = teamSnap.data()?.squad ?? [];
      squad.forEach((pid) => give(pid, "champion"));
    }

    // Veteran: played 5+ matches this season.
    rows.filter((r) => r.matchesPlayed >= 5).forEach((r) => give(r.playerId, "veteran"));

    const batch = db.batch();
    for (const key of awards) {
      const [playerId, type] = key.split("::");
      batch.set(
        db.collection("achievements").doc(`${seasonId}_${playerId}_${type}`),
        {
          playerId,
          seasonId,
          type,
          awardedAt: FieldValue.serverTimestamp(),
          awardedBy: admin.uid,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();

    return NextResponse.json({ ok: true, awarded: awards.size });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to recompute achievements." },
      { status: 400 },
    );
  }
}
