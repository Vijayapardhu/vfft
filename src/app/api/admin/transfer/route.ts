import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { MAX_SQUAD_SIZE, MAX_TRANSFERS_PER_SEASON } from "@/constants/app";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Process a transfer request (SRS §21 / TRD §23). Approving runs an atomic
 * transaction that enforces the rules and moves the money + player:
 *   - ≤ MAX_TRANSFERS_PER_SEASON per team
 *   - blocked when the season's transfers are locked (playoffs)
 *   - buyer purse must cover the fee; buyer squad must have room
 *   - player moves squads, purse debited (buyer) / credited (seller), audited
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const transferId = body?.transferId;
  const action = body?.action;
  if (typeof transferId !== "string" || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = adminDb();

  if (action === "reject") {
    await db.collection("transfers").doc(transferId).update({
      status: "rejected",
      processedBy: admin.uid,
      processedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  try {
    const result = await db.runTransaction(async (tx) => {
      const tRef = db.collection("transfers").doc(transferId);
      const tSnap = await tx.get(tRef);
      if (!tSnap.exists) throw new Error("Transfer not found.");
      const t = tSnap.data() ?? {};
      if (t.status !== "pending") throw new Error("This transfer was already processed.");

      const playerId: string = t.playerId;
      const amount: number = t.amount ?? 0;
      const fromTeamId: string | null = t.fromTeamId ?? null;
      const toTeamId: string | null = t.toTeamId ?? null;
      if (!playerId) throw new Error("Transfer is missing a player.");

      if (t.seasonId) {
        const seasonSnap = await tx.get(db.collection("seasons").doc(t.seasonId));
        if (seasonSnap.data()?.transfersLocked) {
          throw new Error("Transfers are locked for this season (playoffs).");
        }
      }

      const playerRef = db.collection("players").doc(playerId);
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists) throw new Error("Player not found.");

      const fromRef = fromTeamId ? db.collection("teams").doc(fromTeamId) : null;
      const toRef = toTeamId ? db.collection("teams").doc(toTeamId) : null;
      const fromSnap = fromRef ? await tx.get(fromRef) : null;
      const toSnap = toRef ? await tx.get(toRef) : null;
      if (fromRef && !fromSnap?.exists) throw new Error("Selling team not found.");
      if (toRef && !toSnap?.exists) throw new Error("Buying team not found.");
      const fromTeam = fromSnap?.data() ?? {};
      const toTeam = toSnap?.data() ?? {};

      if (toRef) {
        if ((toTeam.transfersUsed ?? 0) >= MAX_TRANSFERS_PER_SEASON)
          throw new Error("Buying team has used all its transfers this season.");
        if ((toTeam.squad?.length ?? 0) >= MAX_SQUAD_SIZE)
          throw new Error("Buying team's squad is full.");
        if ((toTeam.remainingPurse ?? 0) < amount)
          throw new Error("Buying team has insufficient purse.");
      }
      if (fromRef) {
        if ((fromTeam.transfersUsed ?? 0) >= MAX_TRANSFERS_PER_SEASON)
          throw new Error("Selling team has used all its transfers this season.");
        if (!(fromTeam.squad ?? []).includes(playerId))
          throw new Error("Player isn't in the selling team's squad.");
      }

      // Execute.
      tx.update(playerRef, {
        teamId: toTeamId ?? FieldValue.delete(),
        ...(toRef ? { soldPrice: amount } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (fromRef) {
        tx.update(fromRef, {
          squad: FieldValue.arrayRemove(playerId),
          remainingPurse: (fromTeam.remainingPurse ?? 0) + amount,
          transfersUsed: (fromTeam.transfersUsed ?? 0) + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      if (toRef) {
        tx.update(toRef, {
          squad: FieldValue.arrayUnion(playerId),
          remainingPurse: (toTeam.remainingPurse ?? 0) - amount,
          transfersUsed: (toTeam.transfersUsed ?? 0) + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      tx.update(tRef, {
        status: "approved",
        processedBy: admin.uid,
        processedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.collection("auditLogs").doc(), {
        action: "transfer.approved",
        entityType: "player",
        entityId: playerId,
        performedBy: admin.uid,
        timestamp: FieldValue.serverTimestamp(),
        beforeState: { remainingPurse: toTeam.remainingPurse ?? 0 },
        afterState: { remainingPurse: (toTeam.remainingPurse ?? 0) - amount, soldPrice: amount },
      });

      return { status: "approved" as const };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transfer failed." },
      { status: 400 },
    );
  }
}
