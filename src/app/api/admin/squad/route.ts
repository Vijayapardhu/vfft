import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { MAX_SQUAD_SIZE } from "@/constants/app";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";

export const runtime = "nodejs";

/**
 * Admin squad control — full manual roster management, separate from the live
 * auction flow. Every action is one atomic Firestore transaction so the team
 * `squad[]`, the team `remainingPurse`, and the player's `teamId`/`soldPrice`
 * can never drift out of sync.
 *
 * Actions:
 *   - "add"    — sign a free-agent player onto a team for `price` coins.
 *   - "remove" — release a player back to the pool (refunds their soldPrice).
 *   - "move"   — shift a player to another team (refunds the old team, debits
 *                the new team for `price`, default = current soldPrice).
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const playerId = body?.playerId;

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Invalid request — playerId required." }, { status: 400 });
  }
  if (action !== "add" && action !== "remove" && action !== "move") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const db = adminDb();
  const playerRef = db.collection("players").doc(playerId);

  try {
    /* ───────────────────────── add ───────────────────────── */
    if (action === "add") {
      const teamId = body?.teamId;
      const price = Math.max(0, Math.round(Number(body?.price ?? 0)));
      if (typeof teamId !== "string" || !teamId) {
        return NextResponse.json({ error: "teamId required." }, { status: 400 });
      }

      const result = await db.runTransaction(async (tx) => {
        const teamRef = db.collection("teams").doc(teamId);
        const [playerSnap, teamSnap] = await Promise.all([tx.get(playerRef), tx.get(teamRef)]);
        if (!playerSnap.exists) throw new Error("Player not found.");
        if (!teamSnap.exists) throw new Error("Team not found.");
        const player = playerSnap.data() ?? {};
        const team = teamSnap.data() ?? {};

        if (player.status !== "approved") throw new Error("Player is not approved.");
        if (player.teamId) throw new Error("Player is already signed to a team — remove or move them first.");

        const squad: string[] = team.squad ?? [];
        const remaining: number = team.remainingPurse ?? 0;
        if (squad.length >= MAX_SQUAD_SIZE) throw new Error(`Squad is full (max ${MAX_SQUAD_SIZE}).`);
        if (remaining < price) throw new Error("Team has insufficient purse for this price.");

        tx.update(playerRef, {
          teamId,
          soldPrice: price,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(teamRef, {
          squad: FieldValue.arrayUnion(playerId),
          remainingPurse: remaining - price,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("auditLogs").doc(), {
          action: "squad.add",
          entityType: "player",
          entityId: playerId,
          performedBy: admin.uid,
          timestamp: FieldValue.serverTimestamp(),
          beforeState: { teamId: null, remainingPurse: remaining },
          afterState: { teamId, soldPrice: price, remainingPurse: remaining - price },
        });
        return { teamName: (team.name as string) ?? "", ign: (player.ign as string) ?? "Player", price };
      });
      return NextResponse.json({ ok: true, action, ...result });
    }

    /* ──────────────────────── remove ─────────────────────── */
    if (action === "remove") {
      const result = await db.runTransaction(async (tx) => {
        const playerSnap = await tx.get(playerRef);
        if (!playerSnap.exists) throw new Error("Player not found.");
        const player = playerSnap.data() ?? {};
        const fromTeamId: string | null = player.teamId ?? null;
        if (!fromTeamId) throw new Error("Player is not on a team.");

        const refund: number = player.soldPrice ?? 0;
        const teamRef = db.collection("teams").doc(fromTeamId);
        const teamSnap = await tx.get(teamRef);
        const team = teamSnap.exists ? teamSnap.data() ?? {} : null;

        tx.update(playerRef, {
          teamId: FieldValue.delete(),
          soldPrice: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        if (team) {
          tx.update(teamRef, {
            squad: FieldValue.arrayRemove(playerId),
            remainingPurse: (team.remainingPurse ?? 0) + refund,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        tx.set(db.collection("auditLogs").doc(), {
          action: "squad.remove",
          entityType: "player",
          entityId: playerId,
          performedBy: admin.uid,
          timestamp: FieldValue.serverTimestamp(),
          beforeState: { teamId: fromTeamId, soldPrice: refund },
          afterState: { teamId: null, refund },
        });
        return { ign: (player.ign as string) ?? "Player", refund };
      });
      return NextResponse.json({ ok: true, action, ...result });
    }

    /* ───────────────────────── move ──────────────────────── */
    // action === "move"
    const toTeamId = body?.toTeamId;
    if (typeof toTeamId !== "string" || !toTeamId) {
      return NextResponse.json({ error: "toTeamId required." }, { status: 400 });
    }
    const priceOverride =
      body?.price === undefined || body?.price === null
        ? null
        : Math.max(0, Math.round(Number(body.price)));

    const result = await db.runTransaction(async (tx) => {
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists) throw new Error("Player not found.");
      const player = playerSnap.data() ?? {};
      const fromTeamId: string | null = player.teamId ?? null;
      if (!fromTeamId) throw new Error("Player is not on a team — use Add instead.");
      if (fromTeamId === toTeamId) throw new Error("Player is already on that team.");

      const oldPrice: number = player.soldPrice ?? 0;
      const price = priceOverride ?? oldPrice;

      const fromRef = db.collection("teams").doc(fromTeamId);
      const toRef = db.collection("teams").doc(toTeamId);
      const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
      if (!toSnap.exists) throw new Error("Destination team not found.");
      const fromTeam = fromSnap.exists ? fromSnap.data() ?? {} : null;
      const toTeam = toSnap.data() ?? {};

      const toSquad: string[] = toTeam.squad ?? [];
      const toRemaining: number = toTeam.remainingPurse ?? 0;
      if (toSquad.length >= MAX_SQUAD_SIZE) throw new Error(`Destination squad is full (max ${MAX_SQUAD_SIZE}).`);
      if (toRemaining < price) throw new Error("Destination team has insufficient purse.");

      tx.update(playerRef, {
        teamId: toTeamId,
        soldPrice: price,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (fromTeam) {
        tx.update(fromRef, {
          squad: FieldValue.arrayRemove(playerId),
          remainingPurse: (fromTeam.remainingPurse ?? 0) + oldPrice,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      tx.update(toRef, {
        squad: FieldValue.arrayUnion(playerId),
        remainingPurse: toRemaining - price,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.collection("auditLogs").doc(), {
        action: "squad.move",
        entityType: "player",
        entityId: playerId,
        performedBy: admin.uid,
        timestamp: FieldValue.serverTimestamp(),
        beforeState: { teamId: fromTeamId, soldPrice: oldPrice },
        afterState: { teamId: toTeamId, soldPrice: price },
      });
      return {
        ign: (player.ign as string) ?? "Player",
        toTeamName: (toTeam.name as string) ?? "",
        price,
      };
    });
    return NextResponse.json({ ok: true, action, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Squad action failed." },
      { status: 400 },
    );
  }
}
