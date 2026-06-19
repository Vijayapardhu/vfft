"use client";

import { useMemo } from "react";
import { COLLECTIONS, matchCredentialsDoc, typedDoc } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  lineupsByMatchQuery,
  matchDoc,
  matchesBySeasonQuery,
  resultsByMatchQuery,
} from "@/services/matchService";
import type { Lineup, Match, MatchCredentials, Result } from "@/types";
import { useActiveSeason } from "./useActiveSeason";
import { useCollectionData, useDocumentData } from "./useFirestore";

/** All matches in the active season. */
export function useMatches() {
  const { seasonId } = useActiveSeason();
  const q = useMemo(
    () => (isFirebaseConfigured && seasonId ? matchesBySeasonQuery(seasonId) : null),
    [seasonId],
  );
  return useCollectionData<Match>(q, [seasonId]);
}

/** A single match. */
export function useMatch(matchId: string | null) {
  const ref = useMemo(
    () => (isFirebaseConfigured && matchId ? matchDoc(matchId) : null),
    [matchId],
  );
  return useDocumentData<Match>(ref, [matchId]);
}

/** Team results for a match. */
export function useMatchResults(matchId: string | null) {
  const q = useMemo(
    () => (isFirebaseConfigured && matchId ? resultsByMatchQuery(matchId) : null),
    [matchId],
  );
  return useCollectionData<Result>(q, [matchId]);
}

/** Lineups for a match. */
export function useMatchLineups(matchId: string | null) {
  const q = useMemo(
    () => (isFirebaseConfigured && matchId ? lineupsByMatchQuery(matchId) : null),
    [matchId],
  );
  return useCollectionData<Lineup>(q, [matchId]);
}

/**
 * Room credentials for a match — only resolves for admins + participating
 * teams (Rules enforce this); others get a permission error we treat as hidden.
 */
export function useMatchCredentials(matchId: string | null) {
  const ref = useMemo(
    () => (isFirebaseConfigured && matchId ? matchCredentialsDoc(matchId) : null),
    [matchId],
  );
  return useDocumentData<MatchCredentials>(ref, [matchId]);
}

/** A single team's lineup for a match (lineups/{matchId}_{teamId}). */
export function useLineup(matchId: string | null, teamId: string | null) {
  const ref = useMemo(
    () =>
      isFirebaseConfigured && matchId && teamId
        ? typedDoc<Lineup>(COLLECTIONS.lineups, `${matchId}_${teamId}`)
        : null,
    [matchId, teamId],
  );
  return useDocumentData<Lineup>(ref, [matchId, teamId]);
}
