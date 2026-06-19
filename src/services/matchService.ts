import { query, where } from "firebase/firestore";
import {
  lineupsCol,
  matchDoc,
  matchesCol,
  resultsCol,
} from "@/firebase/collections";

/** All matches in a season (sorted client-side by match number / time). */
export function matchesBySeasonQuery(seasonId: string) {
  return query(matchesCol(), where("seasonId", "==", seasonId));
}

/** Team results recorded for a single match. */
export function resultsByMatchQuery(matchId: string) {
  return query(resultsCol(), where("matchId", "==", matchId));
}

/** Approved/submitted lineups for a single match. */
export function lineupsByMatchQuery(matchId: string) {
  return query(lineupsCol(), where("matchId", "==", matchId));
}

export { matchDoc };
