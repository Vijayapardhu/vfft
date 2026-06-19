"use client";

import { useMemo } from "react";
import { orderBy, query } from "firebase/firestore";
import { achievementsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { useCollectionData } from "./useFirestore";
import type { Achievement } from "@/types";

export function useAchievements() {
  const q = useMemo(() => {
    if (!isFirebaseConfigured) return null;
    return query(achievementsCol(), orderBy("awardedAt", "desc"));
  }, []);
  return useCollectionData<Achievement>(q, []);
}
