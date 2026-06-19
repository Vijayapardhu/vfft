"use client";

import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import type { FeaturedContent } from "@/types/realtime";

export function useFeaturedContent() {
  const [content, setContent] = useState<FeaturedContent | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const node = ref(rtdb, "featuredContent");
    const unsubscribe = onValue(node, (snap) => {
      setContent((snap.val() as FeaturedContent) ?? null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { content, loading };
}
