"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { resultsByTeamQuery } from "@/services/resultService";
import { teamSeasonStatsDoc } from "@/services/statsService";
import { teamDoc, teamsBySeasonQuery } from "@/services/teamService";
import type { Result, Team } from "@/types";
import { useActiveSeason } from "./useActiveSeason";
import { useCollectionData, useDocumentData } from "./useFirestore";

/** All teams in the active season. */
export function useTeams() {
  const { seasonId } = useActiveSeason();
  const q = useMemo(
    () => (isFirebaseConfigured && seasonId ? teamsBySeasonQuery(seasonId) : null),
    [seasonId],
  );
  return useCollectionData<Team>(q, [seasonId]);
}

/** A single team. */
export function useTeam(teamId: string | null) {
  const ref = useMemo(
    () => (isFirebaseConfigured && teamId ? teamDoc(teamId) : null),
    [teamId],
  );
  return useDocumentData<Team>(ref, [teamId]);
}

/** A team's per-match results (for performance charts). */
export function useTeamResults(teamId: string | null) {
  const q = useMemo(
    () => (isFirebaseConfigured && teamId ? resultsByTeamQuery(teamId) : null),
    [teamId],
  );
  return useCollectionData<Result>(q, [teamId]);
}

/** Season-aggregated stats for a team. */
export function useTeamSeasonStats(teamId: string | null) {
  const { seasonId } = useActiveSeason();
  const ref = useMemo(
    () =>
      isFirebaseConfigured && teamId && seasonId
        ? teamSeasonStatsDoc(teamId, seasonId)
        : null,
    [teamId, seasonId],
  );
  return useDocumentData(ref, [teamId, seasonId]);
}
