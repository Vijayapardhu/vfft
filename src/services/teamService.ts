import { query, where } from "firebase/firestore";
import { teamDoc, teamsCol } from "@/firebase/collections";

/** All teams in a season. */
export function teamsBySeasonQuery(seasonId: string) {
  return query(teamsCol(), where("seasonId", "==", seasonId));
}

export { teamDoc };
