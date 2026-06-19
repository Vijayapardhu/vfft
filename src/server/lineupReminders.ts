import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { LINEUP_WINDOW_MS } from "@/lib/lineup";
import { adminDb } from "./firebaseAdmin";
import { sendUserNotification } from "./notify";

/**
 * Notify both teams in a fixture to submit their match-day lineup, then stamp
 * `lineupRemindedAt` so the cron doesn't ping them twice. Used by the cron job
 * (auto, 30 min out) and the admin "Notify Lineup" button (manual).
 */
export async function remindMatchLineups(
  matchId: string,
): Promise<{ notified: number }> {
  const db = adminDb();
  const matchSnap = await db.collection("matches").doc(matchId).get();
  if (!matchSnap.exists) throw new Error("Match not found.");
  const match = matchSnap.data() ?? {};

  const teamIds = [match.team1Id, match.team2Id].filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  const recipients = new Set<string>();
  for (const teamId of teamIds) {
    const teamSnap = await db.collection("teams").doc(teamId).get();
    if (!teamSnap.exists) continue;
    const team = teamSnap.data() ?? {};
    for (const uid of [team.teamLeaderUid, team.ownerUid]) {
      if (typeof uid === "string" && uid) recipients.add(uid);
    }
  }

  let notified = 0;
  for (const uid of recipients) {
    await sendUserNotification({
      userId: uid,
      type: "lineup",
      title: `Lineup needed — Match #${match.matchNumber ?? "?"}`,
      body: "Submit your Playing 4, captain & vice-captain before kickoff.",
      href: "/team/lineup",
    });
    notified++;
  }

  await db
    .collection("matches")
    .doc(matchId)
    .update({ lineupRemindedAt: FieldValue.serverTimestamp() });

  return { notified };
}

/**
 * Find upcoming matches whose kickoff is within the lineup window (≤30 min away)
 * and that haven't been reminded yet. Filtered in memory to avoid a composite
 * index on (status, scheduledAt).
 */
export async function findDueLineupMatches(nowMs: number): Promise<string[]> {
  const db = adminDb();
  const snap = await db
    .collection("matches")
    .where("status", "==", "upcoming")
    .get();

  const due: string[] = [];
  for (const d of snap.docs) {
    const m = d.data();
    if (m.lineupRemindedAt) continue;
    const kickoffMs = m.scheduledAt?.toMillis?.() ?? null;
    if (kickoffMs == null) continue;
    // Within the 30-min window and not already past kickoff.
    if (kickoffMs - nowMs <= LINEUP_WINDOW_MS && kickoffMs > nowMs) {
      due.push(d.id);
    }
  }
  return due;
}
