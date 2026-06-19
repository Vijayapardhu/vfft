import type { Messaging } from "firebase/messaging";
import { firebaseApp } from "./config";

/**
 * Firebase Cloud Messaging (TRD §2). Everything is browser-only and the
 * `firebase/messaging` SDK is imported LAZILY (dynamic import) so it never gets
 * pulled into the server/prerender bundle (it references browser-only APIs).
 */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}

/** Request notification permission and return the FCM registration token. */
export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const { getToken } = await import("firebase/messaging");
  return getToken(messaging, { vapidKey });
}

/**
 * Subscribe to foreground messages. Returns an unsubscribe function (a no-op
 * when messaging isn't supported / on the server).
 */
export async function onForegroundMessage(
  cb: (payload: {
    notification?: { title?: string; body?: string };
  }) => void,
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, cb);
}
