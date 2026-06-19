"use client";

import { useMemo } from "react";
import { notificationsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { Notification } from "@/types";
import { limit as limitFn, orderBy, query } from "firebase/firestore";
import { useCollectionData } from "./useFirestore";

export function useNotifications(limit?: number) {
  const q = useMemo(() => {
    if (!isFirebaseConfigured) return null;
    const base = query(notificationsCol(), orderBy("createdAt", "desc"));
    return limit ? query(base, limitFn(limit)) : base;
  }, [limit]);
  return useCollectionData<Notification>(q, [limit]);
}
