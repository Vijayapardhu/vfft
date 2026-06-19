import { query, where } from "firebase/firestore";
import {
  COLLECTIONS,
  playerMatchStatsCol,
  typedDoc,
} from "@/firebase/collections";
import type { PlayerSeasonStats, TeamSeasonStats } from "@/types";

/** All per-match player stats in a season (source for player standings, SRS §15). */
export function playerMatchStatsBySeasonQuery(seasonId: string) {
  return query(playerMatchStatsCol(), where("seasonId", "==", seasonId));
}

/** Every per-match stat line for one player (their match history). */
export function playerMatchStatsByPlayerQuery(playerId: string) {
  return query(playerMatchStatsCol(), where("playerId", "==", playerId));
}

/** All player stat lines for a single match (kill leaderboard source). */
export function playerMatchStatsByMatchQuery(matchId: string) {
  return query(playerMatchStatsCol(), where("matchId", "==", matchId));
}

/** Deterministic doc id for season-scoped aggregates. */
export const seasonStatsId = (entityId: string, seasonId: string) =>
  `${entityId}_${seasonId}`;

export function playerSeasonStatsDoc(playerId: string, seasonId: string) {
  return typedDoc<PlayerSeasonStats>(
    COLLECTIONS.playerSeasonStats,
    seasonStatsId(playerId, seasonId),
  );
}

export function teamSeasonStatsDoc(teamId: string, seasonId: string) {
  return typedDoc<TeamSeasonStats>(
    COLLECTIONS.teamSeasonStats,
    seasonStatsId(teamId, seasonId),
  );
}
