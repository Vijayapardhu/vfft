"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  playerDoc,
  playersBySeasonQuery,
  playersByTeamQuery,
  playersByUidQuery,
} from "@/services/playerService";
import {
  playerMatchStatsByPlayerQuery,
  playerSeasonStatsDoc,
} from "@/services/statsService";
import type { Player, PlayerMatchStats } from "@/types";
import { useActiveSeason } from "./useActiveSeason";
import { useAuth } from "./useAuth";
import { useCollectionData, useDocumentData } from "./useFirestore";

/** All players in the active season. */
export function usePlayers() {
  const { seasonId } = useActiveSeason();
  const q = useMemo(
    () => (isFirebaseConfigured && seasonId ? playersBySeasonQuery(seasonId) : null),
    [seasonId],
  );
  return useCollectionData<Player>(q, [seasonId]);
}

/** Players on a given team. */
export function useTeamPlayers(teamId: string | null) {
  const q = useMemo(
    () => (isFirebaseConfigured && teamId ? playersByTeamQuery(teamId) : null),
    [teamId],
  );
  return useCollectionData<Player>(q, [teamId]);
}

/** A single player profile. */
export function usePlayer(playerId: string | null) {
  const ref = useMemo(
    () => (isFirebaseConfigured && playerId ? playerDoc(playerId) : null),
    [playerId],
  );
  return useDocumentData<Player>(ref, [playerId]);
}

/** The player profile linked to the current account (if any). */
export function useMyPlayer() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid ?? null;
  const q = useMemo(
    () => (isFirebaseConfigured && uid ? playersByUidQuery(uid) : null),
    [uid],
  );
  const { data, loading, error } = useCollectionData<Player>(q, [uid]);
  return { player: data[0] ?? null, loading, error };
}

/** A player's per-match stat history (newest handled by the consumer). */
export function usePlayerMatchHistory(playerId: string | null) {
  const q = useMemo(
    () =>
      isFirebaseConfigured && playerId
        ? playerMatchStatsByPlayerQuery(playerId)
        : null,
    [playerId],
  );
  return useCollectionData<PlayerMatchStats>(q, [playerId]);
}

/** Season-aggregated stats for a player (null until matches are played). */
export function usePlayerSeasonStats(playerId: string | null) {
  const { seasonId } = useActiveSeason();
  const ref = useMemo(
    () =>
      isFirebaseConfigured && playerId && seasonId
        ? playerSeasonStatsDoc(playerId, seasonId)
        : null,
    [playerId, seasonId],
  );
  return useDocumentData(ref, [playerId, seasonId]);
}
