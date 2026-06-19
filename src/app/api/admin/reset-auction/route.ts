import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb, adminRtdb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Admin: full auction reset for the active season.
 * - Clears RTDB auction state (current + feed + sold)
 * - Deletes all `auctions` Firestore docs for the season
 * - Releases all players back to pool (removes teamId + soldPrice)
 * - Resets all teams' remainingPurse back to their purse + empties squad[]
 * - Optionally deletes franchise applications if includeApplications=true
 *
 * This is irreversible — confirm twice before calling.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId: string | undefined = body?.seasonId;
  const includeApplications: boolean = body?.includeApplications === true;
  const confirm: string | undefined = body?.confirm;

  if (confirm !== "RESET_CONFIRMED") {
    return NextResponse.json({ error: "Missing confirmation token." }, { status: 400 });
  }
  if (!seasonId) {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const db = adminDb();
  const rtdb = adminRtdb();
  const results = { auctions: 0, players: 0, teams: 0, applications: 0 };

  try {
    // 1. Clear RTDB auction state
    await rtdb.ref("auction").set(null);

    // 2. Delete all auction Firestore docs for this season (batch of 500)
    const auctionSnap = await db
      .collection("auctions")
      .where("seasonId", "==", seasonId)
      .get();

    const CHUNK = 490;
    for (let i = 0; i < auctionSnap.docs.length; i += CHUNK) {
      const batch = db.batch();
      auctionSnap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
      await batch.commit();
      results.auctions += Math.min(CHUNK, auctionSnap.docs.length - i);
    }

    // Also delete bid sub-collection docs
    const bidSnap = await db
      .collection("bids")
      .where("seasonId", "==", seasonId)
      .get();
    for (let i = 0; i < bidSnap.docs.length; i += CHUNK) {
      const batch = db.batch();
      bidSnap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3. Release players back to pool — clear teamId + soldPrice
    const playerSnap = await db
      .collection("players")
      .where("seasonId", "==", seasonId)
      .where("status", "==", "approved")
      .get();

    for (let i = 0; i < playerSnap.docs.length; i += CHUNK) {
      const batch = db.batch();
      playerSnap.docs.slice(i, i + CHUNK).forEach((d) => {
        batch.update(d.ref, {
          teamId: FieldValue.delete(),
          soldPrice: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      results.players += Math.min(CHUNK, playerSnap.docs.length - i);
    }

    // 4. Reset teams — restore remainingPurse to purse and clear squad
    const teamSnap = await db
      .collection("teams")
      .where("seasonId", "==", seasonId)
      .get();

    for (let i = 0; i < teamSnap.docs.length; i += CHUNK) {
      const batch = db.batch();
      teamSnap.docs.slice(i, i + CHUNK).forEach((d) => {
        const data = d.data();
        batch.update(d.ref, {
          remainingPurse: data.purse ?? 0,
          squad: [],
          transfersUsed: 0,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      results.teams += Math.min(CHUNK, teamSnap.docs.length - i);
    }

    // 5. (Optional) delete franchise applications
    if (includeApplications) {
      const appSnap = await db
        .collection("franchiseApplications")
        .where("seasonId", "==", seasonId)
        .get();
      for (let i = 0; i < appSnap.docs.length; i += CHUNK) {
        const batch = db.batch();
        appSnap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
        await batch.commit();
        results.applications += Math.min(CHUNK, appSnap.docs.length - i);
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("[reset-auction]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reset failed." },
      { status: 500 },
    );
  }
}
