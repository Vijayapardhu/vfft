import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

const PLAYOFF_STAGES: readonly string[] = ["qualifier1", "eliminator", "qualifier2", "final"];

/**
 * IPL-style playoff bracket (SRS §10):
 *   Qualifier 1 : 1st vs 2nd      → winner to Final,        loser to Qualifier 2
 *   Eliminator  : 3rd vs 4th      → winner to Qualifier 2,  loser eliminated
 *   Qualifier 2 : Q1 loser vs Elim winner → winner to Final, loser eliminated
 *   Final       : Q1 winner vs Q2 winner
 *
 * `action: "generate"` seeds Q1 + Eliminator from the cached standings (top 4)
 * and creates Q2 + Final as placeholders. `action: "advance"` fills those
 * placeholders from match results as they come in (idempotent — only fills
 * empty slots, so manual edits are never clobbered).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId = body?.seasonId;
  const action = body?.action === "advance" ? "advance" : "generate";
  if (typeof seasonId !== "string" || !seasonId) {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const db = adminDb();

  try {
    if (action === "advance") {
      const advanced = await advanceBracket(db, seasonId);
      return NextResponse.json({ ok: true, advanced });
    }

    // ── generate ──────────────────────────────────────────────────────────
    const startAt = typeof body?.startAt === "number" ? body.startAt : Date.now();
    const intervalMinutes =
      typeof body?.intervalMinutes === "number" && body.intervalMinutes > 0 ? body.intervalMinutes : 60;
    const map = typeof body?.map === "string" && body.map ? body.map : "Bermuda";

    const [standingsSnap, matchesSnap] = await Promise.all([
      db.collection("cachedTeamStandings").doc(seasonId).get(),
      db.collection("matches").where("seasonId", "==", seasonId).get(),
    ]);

    if (matchesSnap.docs.some((d) => PLAYOFF_STAGES.includes(d.data().stage))) {
      return NextResponse.json(
        { error: "Playoff matches already exist — delete them before regenerating." },
        { status: 400 },
      );
    }

    const standings = (standingsSnap.data()?.standings ?? []) as Array<{ rank: number; teamId: string }>;
    if (standings.length < 4) {
      return NextResponse.json(
        { error: "Need standings with at least 4 ranked teams. Recompute standings first (Standings page)." },
        { status: 400 },
      );
    }
    const top4 = [...standings].sort((a, b) => a.rank - b.rank).slice(0, 4).map((s) => s.teamId);
    const [first, second, third, fourth] = top4;

    const nextNumber =
      Math.max(0, ...matchesSnap.docs.map((d) => (d.data().matchNumber as number) ?? 0)) + 1;
    const intervalMs = intervalMinutes * 60_000;
    const at = (i: number) => new Date(startAt + i * intervalMs);

    const lots = [
      { stage: "qualifier1", name: "Qualifier 1", team1Id: first, team2Id: second },
      { stage: "eliminator", name: "Eliminator", team1Id: third, team2Id: fourth },
      {
        stage: "qualifier2",
        name: "Qualifier 2",
        team1Id: "",
        team2Id: "",
        slot1Label: "Loser of Qualifier 1",
        slot2Label: "Winner of Eliminator",
      },
      {
        stage: "final",
        name: "Grand Final",
        team1Id: "",
        team2Id: "",
        slot1Label: "Winner of Qualifier 1",
        slot2Label: "Winner of Qualifier 2",
      },
    ];

    const batch = db.batch();
    lots.forEach((lot, i) => {
      const ref = db.collection("matches").doc();
      batch.set(ref, {
        seasonId,
        matchNumber: nextNumber + i,
        name: lot.name,
        team1Id: lot.team1Id,
        team2Id: lot.team2Id,
        ...(lot.slot1Label ? { slot1Label: lot.slot1Label } : {}),
        ...(lot.slot2Label ? { slot2Label: lot.slot2Label } : {}),
        map,
        teamSize: 4,
        status: "upcoming",
        stage: lot.stage,
        scheduledAt: at(i),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    return NextResponse.json({ ok: true, count: lots.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Playoff action failed." },
      { status: 400 },
    );
  }
}

/* ── bracket advancement ───────────────────────────────────────────────────── */

type Db = ReturnType<typeof adminDb>;

interface PlayoffMatch {
  id: string;
  team1Id: string;
  team2Id: string;
  status: string;
}

/** Winner/loser of a playoff match from its two result rows, or null if undecided. */
async function decide(
  db: Db,
  seasonId: string,
  match: PlayoffMatch,
): Promise<{ winnerId: string; loserId: string } | null> {
  if (!match.team1Id || !match.team2Id) return null; // participants not set yet
  const snap = await db
    .collection("results")
    .where("matchId", "==", match.id)
    .get();
  const rows = snap.docs.map((d) => d.data() as { teamId: string; outcome?: string; totalPoints?: number });
  const r1 = rows.find((r) => r.teamId === match.team1Id);
  const r2 = rows.find((r) => r.teamId === match.team2Id);
  if (!r1 || !r2) return null; // not both results in yet

  let winnerId: string;
  if (r1.outcome === "win" || r2.outcome === "loss") winnerId = match.team1Id;
  else if (r2.outcome === "win" || r1.outcome === "loss") winnerId = match.team2Id;
  else winnerId = (r1.totalPoints ?? 0) >= (r2.totalPoints ?? 0) ? match.team1Id : match.team2Id;

  const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
  return { winnerId, loserId };
}

async function advanceBracket(db: Db, seasonId: string): Promise<string[]> {
  const snap = await db.collection("matches").where("seasonId", "==", seasonId).get();
  const byStage = (stage: string): PlayoffMatch | null => {
    const d = snap.docs.find((x) => x.data().stage === stage);
    if (!d) return null;
    const data = d.data();
    return { id: d.id, team1Id: data.team1Id ?? "", team2Id: data.team2Id ?? "", status: data.status ?? "" };
  };

  const q1 = byStage("qualifier1");
  const elim = byStage("eliminator");
  const q2 = byStage("qualifier2");
  const final = byStage("final");

  const [q1res, elimRes, q2res] = await Promise.all([
    q1 ? decide(db, seasonId, q1) : Promise.resolve(null),
    elim ? decide(db, seasonId, elim) : Promise.resolve(null),
    q2 ? decide(db, seasonId, q2) : Promise.resolve(null),
  ]);

  const batch = db.batch();
  const advanced: string[] = [];
  const ref = (id: string) => db.collection("matches").doc(id);

  // Q1 winner → Final.team1 ; Q1 loser → Qualifier 2.team1
  if (q1res && final && !final.team1Id) {
    batch.update(ref(final.id), { team1Id: q1res.winnerId, slot1Label: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    advanced.push("Final ← Qualifier 1 winner");
  }
  if (q1res && q2 && !q2.team1Id) {
    batch.update(ref(q2.id), { team1Id: q1res.loserId, slot1Label: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    advanced.push("Qualifier 2 ← Qualifier 1 loser");
  }
  // Eliminator winner → Qualifier 2.team2
  if (elimRes && q2 && !q2.team2Id) {
    batch.update(ref(q2.id), { team2Id: elimRes.winnerId, slot2Label: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    advanced.push("Qualifier 2 ← Eliminator winner");
  }
  // Q2 winner → Final.team2
  if (q2res && final && !final.team2Id) {
    batch.update(ref(final.id), { team2Id: q2res.winnerId, slot2Label: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    advanced.push("Final ← Qualifier 2 winner");
  }

  if (advanced.length > 0) await batch.commit();
  return advanced;
}
