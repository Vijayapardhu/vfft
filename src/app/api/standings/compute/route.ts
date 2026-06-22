import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { adminDb } from "@/server/firebaseAdmin";
import {
  computeTeamStandings,
  computePlayerStandings,
  rankPlayers,
} from "@/lib/standings";
import type {
  CachedTeamStanding,
  Player,
  PlayerMatchStats,
  Result,
  Team,
  WithId,
} from "@/types";

export const runtime = "nodejs";

/** Compute and persist team + player standings from raw match data. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const seasonId: string | undefined = body?.seasonId;

  if (typeof seasonId !== "string") {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  try {
    // --- Read raw data ---
    const [teamSnap, resultSnap, statsSnap, playerSnap] = await Promise.all([
      db.collection("teams").where("seasonId", "==", seasonId).get(),
      db.collection("results").where("seasonId", "==", seasonId).get(),
      db.collection("playerMatchStats").where("seasonId", "==", seasonId).get(),
      db.collection("players").where("seasonId", "==", seasonId).get(),
    ]);

    const teams: WithId<Team>[] = teamSnap.docs.map((d) => ({ id: d.id, ...d.data() as Team }));
    const results: WithId<Result>[] = resultSnap.docs.map((d) => ({ id: d.id, ...d.data() as Result }));
    const stats: WithId<PlayerMatchStats>[] = statsSnap.docs.map((d) => ({ id: d.id, ...d.data() as PlayerMatchStats }));
    const players: WithId<Player>[] = playerSnap.docs.map((d) => ({ id: d.id, ...d.data() as Player }));

    // --- Compute team standings ---
    const teamStandings: CachedTeamStanding[] = computeTeamStandings(results, teams);

    // --- Compute player standings ---
    const rawPlayerStandings = computePlayerStandings(stats, players, teams);
    // The stored "rank" is the auto OVERALL performance rank.
    const playerStandings = rankPlayers(rawPlayerStandings, "performanceScore");

    // --- Write cachedTeamStandings/{seasonId} ---
    await db.collection("cachedTeamStandings").doc(seasonId).set({
      seasonId,
      standings: teamStandings,
      computedAt: now,
    } as Record<string, unknown>);

    // --- Write cachedPlayerStandings/{seasonId} ---
    await db.collection("cachedPlayerStandings").doc(seasonId).set({
      seasonId,
      standings: playerStandings,
      computedAt: now,
    } as Record<string, unknown>);

    // --- Write per-team season stats ---
    const batch = db.batch();
    for (const standing of teamStandings) {
      const ref = db.collection("teamSeasonStats").doc(`${standing.teamId}_${seasonId}`);
      batch.set(ref, {
        seasonId,
        teamId: standing.teamId,
        matchesPlayed: standing.matchesPlayed,
        wins: standing.wins,
        losses: standing.losses,
        kills: standing.kills,
        points: standing.points,
        updatedAt: now,
      });
    }
    await batch.commit();

    // --- Count matches per player from unique matchIds ---
    const matchesByPlayer = new Map<string, Set<string>>();
    for (const s of stats) {
      if (!matchesByPlayer.has(s.playerId)) matchesByPlayer.set(s.playerId, new Set());
      matchesByPlayer.get(s.playerId)!.add(s.matchId);
    }

    // --- Write per-player season stats ---
    const playerBatch = db.batch();
    for (const standing of playerStandings) {
      const ref = db.collection("playerSeasonStats").doc(`${standing.playerId}_${seasonId}`);
      playerBatch.set(ref, {
        seasonId,
        playerId: standing.playerId,
        teamId: standing.teamId,
        matchesPlayed: matchesByPlayer.get(standing.playerId)?.size ?? 0,
        kills: standing.kills,
        deaths: standing.deaths,
        assists: standing.assists,
        knockdowns: standing.knockdowns,
        headshots: standing.headshots,
        damage: standing.damage,
        mvpAwards: standing.mvpAwards,
        performanceScore: standing.performanceScore,
        overallRank: standing.rank,
        updatedAt: now,
      });
    }
    await playerBatch.commit();

    return NextResponse.json({
      ok: true,
      teamCount: teamStandings.length,
      playerCount: playerStandings.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to compute standings." },
      { status: 500 },
    );
  }
}
