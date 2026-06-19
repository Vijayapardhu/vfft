"use client";

import { limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect } from "react";
import { seasonsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { useSeasonStore } from "@/store/seasonStore";

/**
 * Subscribes once to the active season (`seasons` where isActive == true) and
 * publishes it to the season store. Mounted high in the tree so every feature
 * can scope its queries to the right season.
 */
export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const setActiveSeason = useSeasonStore((s) => s.setActiveSeason);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setActiveSeason(null);
      return;
    }
    const q = query(seasonsCol(), where("isActive", "==", true), limit(1));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0]!;
          setActiveSeason({ ...d.data(), id: d.id });
        } else {
          setActiveSeason(null);
        }
      },
      () => setActiveSeason(null),
    );
    return () => unsubscribe();
  }, [setActiveSeason]);

  return <>{children}</>;
}
