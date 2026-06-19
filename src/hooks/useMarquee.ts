"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { activeMarqueeQuery, allMarqueeQuery } from "@/services/contentService";
import type { MarqueeItem } from "@/types";
import { useCollectionData } from "./useFirestore";

export function useMarqueeItems() {
  const q = useMemo(
    () => (isFirebaseConfigured ? activeMarqueeQuery() : null),
    [],
  );
  return useCollectionData<MarqueeItem>(q, []);
}

export function useAllMarqueeItems() {
  const q = useMemo(
    () => (isFirebaseConfigured ? allMarqueeQuery() : null),
    [],
  );
  return useCollectionData<MarqueeItem>(q, []);
}
