import { limit, query, where } from "firebase/firestore";
import { teamDoc, teamsCol } from "@/firebase/collections";

/** All teams in a season. */
export function teamsBySeasonQuery(seasonId: string) {
  return query(teamsCol(), where("seasonId", "==", seasonId));
}

/** Lookup a single team by its URL slug. */
export function teamBySlugQuery(slug: string) {
  return query(teamsCol(), where("slug", "==", slug), limit(1));
}

export { teamDoc };
