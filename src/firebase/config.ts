import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

/**
 * Firebase client app singleton (TRD §8). All values are NEXT_PUBLIC_* — the
 * Firebase web config is designed to be public; security comes from Firestore
 * Rules, App Check and Cloud Functions, never from hiding these keys.
 */
/** True once the real project credentials are filled in `.env.local`. */
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);

/**
 * When credentials are absent (fresh clone / preview build), fall back to
 * harmless non-empty placeholders so `getAuth()` doesn't throw
 * `auth/invalid-api-key` at import time during SSR/prerender. All actual
 * Firebase network calls are gated behind `isFirebaseConfigured`, so these
 * placeholders are never used to talk to a backend.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "vfft-placeholder-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vfft-placeholder",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/** Whether to wire up the local Firebase Emulator Suite. */
export const useEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

/**
 * Initialize Firebase App Check with reCAPTCHA v3 (TRD §26). Browser-only and
 * idempotent. Call once from the client AuthProvider on mount.
 */
export function initAppCheck(): void {
  if (typeof window === "undefined") return;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || useEmulator) return;

  const w = window as unknown as { __VFFT_APPCHECK__?: boolean };
  if (w.__VFFT_APPCHECK__) return;
  w.__VFFT_APPCHECK__ = true;

  // Lazy import so App Check is never pulled into the server bundle.
  void import("firebase/app-check").then(
    ({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    },
  );
}

/** Track which emulators are already wired so we connect at most once. */
export function emulatorConnectOnce(key: string): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { __VFFT_EMU__?: Set<string> };
  w.__VFFT_EMU__ ??= new Set();
  if (w.__VFFT_EMU__.has(key)) return false;
  w.__VFFT_EMU__.add(key);
  return true;
}
