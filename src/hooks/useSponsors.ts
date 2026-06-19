"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/firebase/config";
import { activeSponsorsQuery, allSponsorsQuery } from "@/services/contentService";
import type { Sponsor } from "@/types";
import { useCollectionData } from "./useFirestore";

export function useSponsors() {
  const q = useMemo(
    () => (isFirebaseConfigured ? activeSponsorsQuery() : null),
    [],
  );
  return useCollectionData<Sponsor>(q, []);
}

export function useAllSponsors() {
  const q = useMemo(
    () => (isFirebaseConfigured ? allSponsorsQuery() : null),
    [],
  );
  return useCollectionData<Sponsor>(q, []);
}
