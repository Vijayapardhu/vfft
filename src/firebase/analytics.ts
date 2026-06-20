"use client";

import {
  type Analytics,
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
} from "firebase/analytics";
import { firebaseApp, isFirebaseConfigured } from "./config";

/**
 * Firebase Analytics (GA4) — wired to the project's `measurementId`. Everything
 * here is browser-only, idempotent, and a safe no-op when:
 *   - running on the server (SSR/prerender),
 *   - Firebase isn't configured,
 *   - no measurementId is set, or
 *   - the environment doesn't support Analytics (some in-app/private browsers).
 */
let analyticsPromise: Promise<Analytics | null> | null = null;

function client(): Promise<Analytics | null> {
  if (
    typeof window === "undefined" ||
    !isFirebaseConfigured ||
    !process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  ) {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((ok) => (ok ? getAnalytics(firebaseApp) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

/** Log a SPA page_view — the App Router doesn't fire these automatically. */
export async function logPageView(path: string): Promise<void> {
  const a = await client();
  if (!a) return;
  logEvent(a, "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Log a custom analytics event (safe no-op when analytics is unavailable). */
export async function track(
  name: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const a = await client();
  if (!a) return;
  logEvent(a, name, params);
}

/** Associate events with the signed-in account (cleared on sign-out). */
export async function setAnalyticsUser(uid: string | null): Promise<void> {
  const a = await client();
  if (!a) return;
  setUserId(a, uid ?? null);
}
