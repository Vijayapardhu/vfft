"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  computePlayerStandings,
  computeTeamStandings,
} from "@/lib/standings";
import { resultsBySeasonQuery } from "@/services/resultService";
import { playerMatchStatsBySeasonQuery } from "@/services/statsService";
import type { PlayerMatchStats, Result } from "@/types";
import { useActiveSeason } from "./useActiveSeason";
import { useCollectionData } from "./useFirestore";
import { usePlayers } from "./usePlayers";
import { useTeams } from "./useTeams";

function useResults() {
  const { seasonId } = useActiveSeason();
  const q = useMemo(
    () => (isFirebaseConfigured && seasonId ? resultsBySeasonQuery(seasonId) : null),
    [seasonId],
  );
  return useCollectionData<Result>(q, [seasonId]);
}

function usePlayerMatchStats() {
  const { seasonId } = useActiveSeason();
  const q = useMemo(
    () =>
      isFirebaseConfigured && seasonId
        ? playerMatchStatsBySeasonQuery(seasonId)
        : null,
    [seasonId],
  );
  return useCollectionData<PlayerMatchStats>(q, [seasonId]);
}

/**
 * Team standings derived live from `results` (SRS §14). Phase 4 will read the
 * Cloud-Function-maintained `cachedTeamStandings` for scale; deriving here keeps
 * the leaderboard functional in the meantime.
 */
export function useTeamStandings() {
  const { data: results, loading: rLoading, error } = useResults();
  const { data: teams, loading: tLoading } = useTeams();
  const standings = useMemo(
    () => computeTeamStandings(results, teams),
    [results, teams],
  );
  return { standings, loading: rLoading || tLoading, error };
}

/** Player standings derived live from `playerMatchStats` (SRS §15). */
export function usePlayerStandings() {
  const { data: stats, loading: sLoading, error } = usePlayerMatchStats();
  const { data: players, loading: pLoading } = usePlayers();
  const { data: teams, loading: tLoading } = useTeams();
  const standings = useMemo(
    () => computePlayerStandings(stats, players, teams),
    [stats, players, teams],
  );
  return { standings, loading: sLoading || pLoading || tLoading, error };
}
