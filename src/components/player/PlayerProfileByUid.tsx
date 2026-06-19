"use client";

import { useMemo } from "react";
import { UserRound } from "lucide-react";
import { PlayerProfile } from "./PlayerProfile";
import { EmptyState } from "@/components/ui/empty-state";
import { FullScreenLoader } from "@/components/ui/spinner";
import { isFirebaseConfigured } from "@/firebase/config";
import { playersByUidQuery } from "@/services/playerService";
import { useCollectionData } from "@/hooks/useFirestore";
import type { Player } from "@/types";

export function PlayerProfileByUid({ uid }: { uid: string }) {
  const q = useMemo(
    () => (isFirebaseConfigured && uid ? playersByUidQuery(uid) : null),
    [uid],
  );
  const { data: players, loading } = useCollectionData<Player>(q, [uid]);

  if (loading) return <FullScreenLoader />;

  const player = players[0];
  if (!player) {
    return (
      <EmptyState
        icon={UserRound}
        title="Player not found"
        message="No player profile found at this URL."
      />
    );
  }

  return <PlayerProfile playerId={player.id} />;
}
