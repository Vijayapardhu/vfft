import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Admin approves or rejects an emergency substitution (SRS §22). On approval the
 * swap is APPLIED to the match-day lineup (out → in, including captain/vice if
 * the captain is the one being replaced) inside a transaction, and the actor is
 * recorded as the admin's uid (not a literal "admin").
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const substitutionId = body?.substitutionId;
  const action = body?.action;
  if (
    typeof substitutionId !== "string" ||
    (action !== "approve" && action !== "reject")
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();
  const subRef = db.collection("substitutions").doc(substitutionId);

  try {
    if (action === "reject") {
      await subRef.update({
        status: "rejected",
        processedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    await db.runTransaction(async (tx) => {
      const subSnap = await tx.get(subRef);
      if (!subSnap.exists) throw new Error("Substitution not found.");
      const sub = subSnap.data() ?? {};
      if (sub.status !== "pending") {
        throw new Error("This substitution has already been processed.");
      }

      const { matchId, teamId, outPlayerId, inPlayerId } = sub;
      const lineupRef = db.collection("lineups").doc(`${matchId}_${teamId}`);
      const lineupSnap = await tx.get(lineupRef);

      // Apply the swap to the lineup when one exists.
      if (lineupSnap.exists) {
        const lineup = lineupSnap.data() ?? {};
        const playingFour: string[] = Array.isArray(lineup.playingFour)
          ? lineup.playingFour
          : [];
        if (playingFour.includes(outPlayerId)) {
          const swapped = playingFour.map((id) =>
            id === outPlayerId ? inPlayerId : id,
          );
          tx.update(lineupRef, {
            playingFour: swapped,
            captainId:
              lineup.captainId === outPlayerId ? inPlayerId : lineup.captainId,
            viceCaptainId:
              lineup.viceCaptainId === outPlayerId
                ? inPlayerId
                : lineup.viceCaptainId,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      tx.update(subRef, {
        status: "approved",
        approvedBy: admin.uid,
        approvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, status: "approved" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to process substitution." },
      { status: 400 },
    );
  }
}
