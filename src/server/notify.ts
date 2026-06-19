import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "./firebaseAdmin";
import { pushUserNotification } from "./liveState";

/**
 * Deliver a notification to a single user through every channel: the persistent
 * Firestore `notifications` doc (inbox history), the RTDB inbox (instant), and
 * web push (best-effort). Shared by the admin notify route and the lineup
 * reminder jobs so delivery stays consistent.
 */
export async function sendUserNotification(input: {
  userId: string;
  type?: string;
  title: string;
  body: string;
  href?: string;
}): Promise<string> {
  const db = adminDb();
  const { userId, title, body } = input;
  const type = input.type ?? "general";
  const href = input.href;

  const docRef = await db.collection("notifications").add({
    userId,
    type,
    title,
    body,
    read: false,
    ...(href ? { href } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await pushUserNotification(userId, {
    id: docRef.id,
    type,
    title,
    body,
    read: false,
    ts: Date.now(),
    ...(href ? { href } : {}),
  });

  const userSnap = await db.collection("users").doc(userId).get();
  const tokens: string[] = userSnap.data()?.fcmTokens ?? [];
  if (tokens.length > 0) {
    try {
      await adminMessaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: href ? { fcmOptions: { link: href } } : undefined,
      });
    } catch {
      // Push failures must not fail the caller.
    }
  }

  return docRef.id;
}

/**
 * Broadcast to EVERY user: one Firestore "all" doc (shows in every bell) plus a
 * batched FCM web-push to all registered device tokens. Push failures never fail
 * the caller. Returns the doc id and how many pushes succeeded.
 */
export async function broadcastNotification(input: {
  type?: string;
  title: string;
  body: string;
  href?: string;
}): Promise<{ id: string; pushed: number }> {
  const db = adminDb();
  const { title, body } = input;
  const type = input.type ?? "general";
  const href = input.href;

  const docRef = await db.collection("notifications").add({
    userId: "all",
    type,
    title,
    body,
    read: false,
    ...(href ? { href } : {}),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Collect every device token across all users.
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
    // FCM multicast caps at 500 tokens per call.
    for (let i = 0; i < tokens.length; i += 500) {
      try {
        const res = await messaging.sendEachForMulticast({
          tokens: tokens.slice(i, i + 500),
          notification: { title, body },
          webpush: href ? { fcmOptions: { link: href } } : undefined,
        });
        pushed += res.successCount;
      } catch {
        // Ignore a failed batch; keep delivering the rest.
      }
    }
  }

  return { id: docRef.id, pushed };
}
