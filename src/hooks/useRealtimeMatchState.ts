"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import type { MatchState } from "@/types/realtime";

export function useRealtimeMatchState(matchId: string | null) {
  const [state, setState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !matchId) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const node = ref(rtdb, `matchState/${matchId}`);
    const unsubscribe = onValue(
      node,
      (snap) => {
        setState((snap.val() as MatchState) ?? null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [matchId]);

  return { state, loading, error };
}
