import type { PlayerRole, PlayerStatus, Timestamp, Timestamps } from "./common";

/**
 * `players/{playerId}` — a participant's PUBLIC profile (SRS §4).
 * Visitors can read these (SRS §2), so this document holds NO PII.
 * Contact PII lives in the private subcollection (see {@link PlayerContact}).
 */
export interface Player extends Timestamps {
  /** Owning account (users/{uid}). */
  uid: string;
  seasonId: string;

  ign: string;
  role: PlayerRole;
  device: string;
  photoURL: string | null;

  status: PlayerStatus;

  // --- Player mastery ---
  /** Gun levels keyed by weapon id (e.g. { AK: 8, M4A1: 5 }). */
  weapons?: Record<string, number>;
  /** Role proficiency percentages (0-100 each, should sum to ~100). */
  rolePercentages?: Partial<Record<PlayerRole, number>>;
  /** Achievement / title strings (e.g. "Headshot King", "MVP"). */
  titles?: string[];

  // --- Set by the auction / admin (server-authoritative) ---
  teamId?: string;
  soldPrice?: number;

  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectedReason?: string;
}

/**
 * `players/{playerId}/private/contact` — sensitive PII, isolated from the
 * public profile and readable only by the owning account and admins (enforced
 * by Firestore Rules). These fields must NEVER appear in audit logs (TRD §20).
 */
export interface PlayerContact {
  /** Owning account — used by rules to verify ownership. */
  uid: string;
  realName: string;
  freeFireUid: string;
  whatsappNumber: string;
}
