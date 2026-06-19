"use client";

import { onSnapshot, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { weaponsCol } from "@/firebase/collections";
import type { Weapon } from "@/types";

export function useWeapons() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(weaponsCol(), orderBy("name"));

    const unsub = onSnapshot(q, (snap) => {
      // Attach the Firestore doc id so edit/delete target the real document.
      const list: Weapon[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id }));
      setWeapons(list);
      setLoading(false);
    });

    return unsub;
  }, []);

  // Compute categories from weapon data
  const categories = [...new Set(weapons.map((w) => w.category))];

  return { weapons, categories, loading };
}
