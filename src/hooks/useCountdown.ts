"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import type { RealtimeCountdown } from "@/types/realtime";

export function useCountdown(id: string | null) {
  const [countdown, setCountdown] = useState<RealtimeCountdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured || !id) {
      setCountdown(null);
      setLoading(false);
      setTimeRemaining(0);
      return;
    }
    setLoading(true);
    const node = ref(rtdb, `countdowns/${id}`);
    const unsubscribe = onValue(node, (snap) => {
      const data = snap.val() as RealtimeCountdown | null;
      setCountdown(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!countdown) {
      setTimeRemaining(0);
      return;
    }
    const target = countdown.targetTime;
    function tick() {
      setTimeRemaining(Math.max(0, target - Date.now()));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const isExpired = timeRemaining <= 0 && countdown !== null;

  return { countdown, timeRemaining, isExpired, loading };
}
