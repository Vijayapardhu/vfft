"use client";

import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { COLLECTIONS } from "@/firebase/collections";
import { isFirebaseConfigured } from "@/firebase/config";
import { db } from "@/firebase/firestore";
import { onForegroundMessage, requestFcmToken } from "@/firebase/messaging";
import { useAuth } from "./useAuth";

type Status = NotificationPermission | "unsupported";

/**
 * Web-push wiring: ask for permission, register the FCM token to the user's
 * `fcmTokens`, and surface foreground messages as native notifications.
 * (Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY; degrades gracefully without it.)
 */
export function useFcm() {
  const { firebaseUser } = useAuth();
  const [permission, setPermission] = useState<Status>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Foreground messages → show a native notification.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let active = true;
    void onForegroundMessage((payload) => {
      const n = payload.notification;
      if (n?.title && Notification.permission === "granted") {
        new Notification(n.title, { body: n.body ?? "" });
      }
    }).then((u) => {
      if (active) unsub = u;
      else u();
    });
    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  const enable = useCallback(async () => {
    if (!isFirebaseConfigured || !firebaseUser) return;
    setBusy(true);
    try {
      const token = await requestFcmToken();
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
      if (token) {
        await updateDoc(doc(db, COLLECTIONS.users, firebaseUser.uid), {
          fcmTokens: arrayUnion(token),
        });
      }
    } finally {
      setBusy(false);
    }
  }, [firebaseUser]);

  return { permission, enable, busy };
}
