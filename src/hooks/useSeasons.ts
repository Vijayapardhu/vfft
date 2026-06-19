"use client";

import { onSnapshot, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { seasonsCol } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import type { Season } from "@/types/Season";

export interface SeasonWithId extends Season {
  id: string;
}

export function useSeasons() {
  const [data, setData] = useState<SeasonWithId[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    const q = query(seasonsCol(), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeasonWithId)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
}
