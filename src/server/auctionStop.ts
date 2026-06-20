import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminRtdb } from "./firebaseAdmin";

/**
 * Force-stop any live auction.
 *
 * The bug this fixes: clearing only the RTDB live board left the Firestore
 * auction doc at `status: "active"`, so the engine still believed a lot was
 * running — the public board could re-hydrate it and `start` refused to open a
 * new lot ("Another auction is already active"). A proper stop must cancel the
 * Firestore record too.
 *
 * This marks the active lot(s) "unsold" (cancelled — NO sale, no purse change)
 * so the player drops straight back into the auction pool, then wipes the RTDB
 * live board + bid feed. Fully idempotent.
 *
 * @returns the number of active lots that were cancelled.
 */
export async function stopActiveAuctions(opts?: {
  auctionId?: string;
  seasonId?: string;
  performedBy?: string;
}): Promise<number> {
  const db = adminDb();

  // Resolve which lots to cancel: a specific id if given, else every active lot
  // (optionally narrowed to one season). `where status == active` is a single
  // field filter — no composite index needed.
  let docs;
  if (opts?.auctionId) {
    const snap = await db.collection("auctions").doc(opts.auctionId).get();
    docs = snap.exists && snap.data()?.status === "active" ? [snap] : [];
  } else {
    const snap = await db.collection("auctions").where("status", "==", "active").get();
    docs = opts?.seasonId
      ? snap.docs.filter((d) => d.data().seasonId === opts.seasonId)
      : snap.docs;
  }

  if (docs.length > 0) {
    const batch = db.batch();
    for (const d of docs) {
      batch.update(d.ref, {
        status: "unsold",
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.collection("auditLogs").doc(), {
        action: "auction.stopped",
        entityType: "auction",
        entityId: d.id,
        performedBy: opts?.performedBy ?? "system:stop",
        timestamp: FieldValue.serverTimestamp(),
        beforeState: { status: "active", playerId: d.data()?.playerId ?? null },
        afterState: { status: "unsold" },
      });
    }
    await batch.commit();
  }

  // Wipe the live board + ticker + any pending spin reel so spectators and the
  // admin console clear.
  const rtdb = adminRtdb();
  await rtdb.ref("auction/current").set(null);
  await rtdb.ref("auction/feed").set(null);
  await rtdb.ref("auction/spin").set(null);

  return docs.length;
}
