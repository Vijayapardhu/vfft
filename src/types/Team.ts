import type { Timestamps } from "./common";

/**
 * `teams/{teamId}` — a franchise (SRS §5). Admin-created.
 * `remainingPurse` is written ONLY by Cloud Functions (TRD §16) — never the client.
 */
export interface Team extends Timestamps {
  seasonId: string;

  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;

  ownerUid: string;
  teamLeaderUid: string;

  /** Total virtual budget (default FRANCHISE_BUDGET = 10000). */
  purse: number;
  /** Remaining coins after auction spend. Server-managed. */
  remainingPurse: number;

  /** Player ids on the roster (max MAX_SQUAD_SIZE). */
  squad: string[];

  /** Optional franchise brand colors (hex). */
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;

  /** Franchise identity fields. */
  slogan?: string;
  shortName?: string;
  description?: string;

  /** Social links. */
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    discord?: string;
  };

  transfersUsed?: number;

  /** URL-safe identifier for public team page. Generated from name on creation. */
  slug?: string;
}
