/**
 * Core, league-wide constants derived directly from the requirement docs.
 * These are business rules — they must match SRS/PRD/TRD exactly.
 */

export const APP_NAME = "VFFT";
export const APP_FULL_NAME = "Velangi Free Fire Tournament";
export const APP_TAGLINE = "Where Village Legends Rise";

/** Virtual franchise budget in coins (SRS §5). Coins are virtual only — no real money. */
export const FRANCHISE_BUDGET = 10_000;

/** Squad rules (SRS §7 / PRD). */
export const MAX_SQUAD_SIZE = 10;
export const PLAYING_SQUAD_SIZE = 4;
export const BENCH_SIZE = 6;

/** Match-day lineup must be submitted this many minutes before kickoff (SRS §8). */
export const LINEUP_LOCK_MINUTES_BEFORE = 30;

/** Transfer rules (SRS §21 / TRD §23). Enforced server-side by Cloud Functions. */
export const MAX_TRANSFERS_PER_SEASON = 2;

/** Default auction lot countdown in seconds for timed mode (UID §15). */
export const AUCTION_COUNTDOWN_SECONDS = 30;

/** "Going once, going twice, SOLD" hammer countdown (seconds). */
export const AUCTION_HAMMER_SECONDS = 3;

/** Anti-snipe: a bid placed in the final window resets the clock to this many seconds. */
export const AUCTION_BID_EXTEND_SECONDS = 8;

/** Data-retention windows (SRS §29). */
export const REJECTED_PLAYER_RETENTION_DAYS = 30;
export const INACTIVE_PLAYER_RETENTION_DAYS = 90;

/** Player in-game roles (SRS §4). */
export const PLAYER_ROLES = ["rusher", "sniper", "support", "igl"] as const;

export const PLAYER_ROLE_LABELS: Record<(typeof PLAYER_ROLES)[number], string> = {
  rusher: "Rusher",
  sniper: "Sniper",
  support: "Support",
  igl: "IGL",
};
