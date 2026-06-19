"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/firebase/auth";
import { initAppCheck, isFirebaseConfigured } from "@/firebase/config";
import { ensureUserDocument } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

/**
 * Subscribes to Firebase Auth and keeps the auth store in sync. Mount once,
 * high in the tree. Browser-only side effects (App Check, auth listener) run
 * inside the effect so SSR stays clean.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setStatus = useAuthStore((s) => s.setStatus);

  useEffect(() => {
    initAppCheck();

    // Without credentials there is nothing to listen to — resolve to guest so
    // the UI never hangs on the loading state.
    if (!isFirebaseConfigured) {
      setStatus("unauthenticated");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuth(null, null);
        return;
      }
      try {
        const profile = await ensureUserDocument(fbUser);
        setAuth(fbUser, profile);
      } catch {
        // Authenticated, but the profile read failed (e.g. Rules/offline).
        setAuth(fbUser, null);
      }
    });

    return () => unsubscribe();
  }, [setAuth, setStatus]);

  return <>{children}</>;
}
