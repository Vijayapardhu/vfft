import type { Timestamp, Timestamps } from "./common";

/** Achievement badges (SRS §20). */
export type AchievementType =
  | "champion"
  | "mvp"
  | "killMachine"
  | "sniperKing"
  | "clutchMaster"
  | "terminator"
  | "legend"
  | "veteran";

/**
 * `achievements/{id}` — awarded to a player (SRS §20).
 * Granted by Cloud Functions only (ADB §16) — never client-written.
 */
export interface Achievement extends Timestamps {
  playerId: string;
  seasonId?: string;
  type: AchievementType;
  awardedAt: Timestamp;
  awardedBy?: string;
}
