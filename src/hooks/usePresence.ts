"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import { setUserOnline, setUserOffline } from "@/services/rtdbService";
import type { PresenceUser } from "@/types/realtime";

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<
    Record<string, PresenceUser>
  >({});
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const node = ref(rtdb, "presence");
    const unsubscribe = onValue(node, (snap) => {
      setOnlineUsers((snap.val() as Record<string, PresenceUser>) ?? {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { onlineUsers, loading };
}

export function useUserPresence(
  userId: string | null,
  displayName?: string,
  photoURL?: string,
) {
  useEffect(() => {
    if (!isFirebaseConfigured || !userId) return;
    const currentId = userId;
    setUserOnline(currentId, displayName ?? "Anonymous", photoURL ?? "");
    return () => {
      if (currentId) setUserOffline(currentId);
    };
  }, [userId, displayName, photoURL]);
}
