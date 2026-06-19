import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "./firebaseAdmin";
import { pushUserNotification } from "./liveState";

export interface NotifyInput {
  type?: string;
  title: string;
  body: string;
  href?: string;
  imageUrl?: string;
}

/**
 * Build the DATA-ONLY FCM message payload. We deliberately avoid the
 * `notification` payload: with `notification`, the browser auto-displays the
 * push AND our service worker's onBackgroundMessage shows it too → duplicate
 * notifications. Data-only means the SW shows it exactly once, and foreground
 * messages are handled in-app (the bell), so there's never a double.
 */
function fcmData(input: NotifyInput): Record<string, string> {
  const data: Record<string, string> = {
    title: input.title,
    body: input.body,
    type: input.type ?? "general",
  };
  if (input.href) data.href = input.href;
  if (input.imageUrl) data.image = input.imageUrl;
  return data;
}

/** Persisted Firestore notification doc fields (shared by targeted + broadcast). */
function notifDoc(input: NotifyInput, userId: string) {
  return {
    userId,
    type: input.type ?? "general",
    title: input.title,
    body: input.body,
    read: false,
    ...(input.href ? { href: input.href } : {}),
    ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Deliver a notification to a single user: Firestore inbox doc + RTDB inbox
 * (instant) + a single web push (data-only, no duplicates).
 */
export async function sendUserNotification(
  input: NotifyInput & { userId: string },
): Promise<string> {
  const db = adminDb();
  const { userId } = input;

  const docRef = await db.collection("notifications").add(notifDoc(input, userId));

  await pushUserNotification(userId, {
    id: docRef.id,
    type: input.type ?? "general",
    title: input.title,
    body: input.body,
    read: false,
    ts: Date.now(),
    ...(input.href ? { href: input.href } : {}),
    ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
  });

  const userSnap = await db.collection("users").doc(userId).get();
  const tokens: string[] = userSnap.data()?.fcmTokens ?? [];
  if (tokens.length > 0) {
    try {
      await adminMessaging().sendEachForMulticast({ tokens, data: fcmData(input) });
    } catch {
      // Push failures must not fail the caller.
    }
  }

  return docRef.id;
}

/**
 * Broadcast to EVERY user: one Firestore "all" doc (shown in every bell) plus a
 * single batched data-only web push to all registered devices.
 */
export async function broadcastNotification(
  input: NotifyInput,
): Promise<{ id: string; pushed: number }> {
  const db = adminDb();

  const docRef = await db.collection("notifications").add(notifDoc(input, "all"));

  const usersSnap = await db.collection("users").get();
  const tokens: string[] = [];
  usersSnap.forEach((u) => {
    const t = u.data()?.fcmTokens;
    if (Array.isArray(t)) {
      for (const tok of t) if (typeof tok === "string" && tok) tokens.push(tok);
    }
  });

  let pushed = 0;
  if (tokens.length > 0) {
    const messaging = adminMessaging();
    const data = fcmData(input);
    for (let i = 0; i < tokens.length; i += 500) {
      try {
        const res = await messaging.sendEachForMulticast({
          tokens: tokens.slice(i, i + 500),
          data,
        });
        pushed += res.successCount;
      } catch {
        // Ignore a failed batch; keep delivering the rest.
      }
    }
  }

  return { id: docRef.id, pushed };
}
