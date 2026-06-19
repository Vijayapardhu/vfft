"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { rtdb } from "@/firebase/rtdb";
import type { BidFeedEntry, CurrentAuctionState, SoldEntry } from "@/types";

/** Subscribe to the live auction lot at RTDB `auction/current`. */
export function useCurrentAuction() {
  const [state, setState] = useState<{
    data: CurrentAuctionState | null;
    loading: boolean;
  }>({ data: null, loading: isFirebaseConfigured });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState({ data: null, loading: false });
      return;
    }
    const node = ref(rtdb, "auction/current");
    const unsubscribe = onValue(
      node,
      (snap) => setState({ data: (snap.val() as CurrentAuctionState) ?? null, loading: false }),
      () => setState({ data: null, loading: false }),
    );
    return () => unsubscribe();
  }, []);

  return state;
}

function useRtdbList<T extends { ts: number }>(
  path: string,
  limit: number,
): T[] {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const node = ref(rtdb, path);
    const unsubscribe = onValue(
      node,
      (snap) => {
        const val = (snap.val() as Record<string, T> | null) ?? {};
        const list = Object.values(val).sort((a, b) => b.ts - a.ts);
        setItems(list.slice(0, limit));
      },
      () => setItems([]),
    );
    return () => unsubscribe();
  }, [path, limit]);
  return items;
}

/** Live bid ticker for the current lot (newest first). */
export function useAuctionFeed(): BidFeedEntry[] {
  return useRtdbList<BidFeedEntry>("auction/feed", 15);
}

/** Recently sold players this session (newest first). */
export function useSoldBoard(): SoldEntry[] {
  return useRtdbList<SoldEntry>("auction/sold", 8);
}
