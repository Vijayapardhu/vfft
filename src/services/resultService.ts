import { query, where } from "firebase/firestore";
import { resultsCol } from "@/firebase/collections";

/** All team results in a season (source for team standings, SRS §14). */
export function resultsBySeasonQuery(seasonId: string) {
  return query(resultsCol(), where("seasonId", "==", seasonId));
}

/** A single team's results across the season (for performance charts). */
export function resultsByTeamQuery(teamId: string) {
  return query(resultsCol(), where("teamId", "==", teamId));
}
