"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import type { RealtimeNotification } from "@/types/realtime";

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const node = ref(rtdb, `notifications/${userId}`);
    const unsubscribe = onValue(node, (snap) => {
      const data = snap.val() as Record<string, RealtimeNotification> | null;
      if (!data) {
        setNotifications([]);
      } else {
        const list = Object.entries(data).map(([id, n]) => ({
          ...n,
          id: id ?? n.id,
        }));
        list.sort((a, b) => b.ts - a.ts);
        setNotifications(list);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading };
}
