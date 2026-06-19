import "server-only";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Firebase Admin SDK — runs ONLY on the server (Next.js Route Handlers on
 * Vercel). This is our server-authoritative engine in place of Cloud Functions
 * (the project stays on the free Spark plan). The Admin SDK bypasses Firestore
 * Rules, so these routes are the sole writers for the locked-down collections.
 */
export const isAdminConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_B64);

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) return null;
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

function adminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0] as App;

  const sa = loadServiceAccount();
  if (!sa) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_B64 (base64 of the service account JSON).",
    );
  }
  return initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export function adminAuth() {
  return getAuth(adminApp());
}

/** Firestore — permanent records (users, players, teams, results, ...). */
export function adminDb() {
  return getFirestore(adminApp());
}

/** Realtime Database — the live engine (auction/current, matchState, ...). */
export function adminRtdb() {
  return getDatabase(adminApp());
}

/** Cloud Messaging — server-side push (FCM). */
export function adminMessaging() {
  return getMessaging(adminApp());
}
