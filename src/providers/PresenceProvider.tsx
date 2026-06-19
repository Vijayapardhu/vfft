"use client";

import { useEffect, useRef } from "react";
import { onDisconnect, ref, set } from "firebase/database";
import { rtdb } from "@/firebase/rtdb";
import { isFirebaseConfigured } from "@/firebase/config";
import { useAuthStore } from "@/store/authStore";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const prevUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    if (prevUid.current && prevUid.current !== user?.uid) {
      const oldRef = ref(rtdb, `presence/${prevUid.current}`);
      set(oldRef, null);
    }

    prevUid.current = user?.uid ?? null;

    if (!user) return;

    const userRef = ref(rtdb, `presence/${user.uid}`);

    const dc = onDisconnect(userRef);
    dc.remove();

    set(userRef, {
      displayName: user.displayName ?? user.email ?? "Anonymous",
      photoURL: user.photoURL ?? "",
      lastOnline: Date.now(),
    });

    return () => {
      dc.cancel();
      set(userRef, null);
    };
  }, [user]);

  return <>{children}</>;
}
