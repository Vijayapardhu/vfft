"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import type { AuctionCurrent } from "@/types/realtime";

function normalize(data: Record<string, unknown> | null): AuctionCurrent | null {
  if (!data) return null;
  return {
    auctionId: (data.auctionId as string) ?? "",
    playerId: (data.playerId as string) ?? "",
    playerName: (data.playerIgn as string) ?? (data.playerName as string) ?? "",
    playerPhoto: (data.playerPhotoURL as string) ?? (data.playerPhoto as string) ?? null,
    playerRole: (data.playerRole as string) ?? "",
    mode: (data.mode as "timed" | "manual") ?? "manual",
    basePrice: (data.basePrice as number) ?? 0,
    currentBid: (data.currentBid as number) ?? (data.highestBid as number) ?? 0,
    highestBidTeamId: (data.highestTeamId as string) ?? (data.highestBidTeamId as string) ?? null,
    highestBidTeamName: (data.highestTeamName as string) ?? (data.highestBidTeamName as string) ?? null,
    status: (data.status as "active" | "sold" | "unsold") ?? "unsold",
    endsAt: (data.endsAt as number | null) ?? null,
    timerSeconds: (data.timerSeconds as number) ?? 0,
    soldPrice: data.soldPrice as number | undefined,
  };
}

export function useRealtimeAuction() {
  const [auction, setAuction] = useState<AuctionCurrent | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const node = ref(rtdb, "auction/current");
    const unsubscribe = onValue(
      node,
      (snap) => {
        setAuction(normalize(snap.val()));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  return { auction, loading, error };
}
