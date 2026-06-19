import type { SeasonStatus, Timestamp, Timestamps } from "./common";

/**
 * `seasons/{seasonId}` — an isolated competitive season (SRS §27).
 * Season data is isolated so previous seasons are never overwritten.
 */
export interface Season extends Timestamps {
  number: number;
  name: string; // e.g. "Season 1"
  status: SeasonStatus;
  isActive: boolean;

  prizePool?: string;
  championTeamId?: string;
  mvpPlayerId?: string;

  startDate?: Timestamp;
  endDate?: Timestamp;
}
