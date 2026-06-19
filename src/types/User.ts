import type { Timestamps, UserRole } from "./common";

/**
 * `users/{uid}` — the account record, keyed by Firebase Auth UID.
 * Created on first Google Sign-In. `role` drives client-side UX gating only;
 * real authorization lives in Firestore Rules + Cloud Functions.
 */
export interface User extends Timestamps {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;

  /** Linked player profile, once registered (players/{playerId}). */
  playerId?: string;
  /** Team a team-leader manages / franchise-owner owns. */
  teamId?: string;

  /** FCM registration tokens for web push (TRD §2). */
  fcmTokens?: string[];

  lastLoginAt?: Timestamps["updatedAt"];
}
