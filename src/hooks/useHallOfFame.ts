"use client";

import { useMemo } from "react";
import { hallOfFameCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { HallOfFameEntry } from "@/types";
import { orderBy, query } from "firebase/firestore";
import { useCollectionData } from "./useFirestore";

export function useHallOfFame() {
  const q = useMemo(() => {
    if (!isFirebaseConfigured) return null;
    return query(hallOfFameCol(), orderBy("updatedAt", "desc"));
  }, []);
  return useCollectionData<HallOfFameEntry>(q, []);
}
