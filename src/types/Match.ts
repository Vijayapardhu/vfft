import type { MatchStage, MatchStatus, Timestamp, Timestamps } from "./common";

/**
 * `matches/{matchId}` — a scheduled fixture (SRS §9), modelled as Team 1 vs
 * Team 2 (IPL framing). This is the PUBLIC fixture doc — room credentials are
 * NOT here (they would leak); they live in the private subcollection below.
 */
export interface Match extends Timestamps {
  seasonId: string;

  matchNumber: number;
  /** Optional admin label shown instead of "Match #N" (e.g. "Grand Final"). */
  name?: string;
  scheduledAt: Timestamp;

  team1Id: string;
  team2Id: string;

  map: string;

  /** Players per side that actually play this match (room size). Default 4. */
  teamSize?: number;

  status: MatchStatus;
  stage: MatchStage;

  /** Set when team leaders have been pinged to submit their match-day lineup. */
  lineupRemindedAt?: Timestamp;
}

/**
 * `matches/{matchId}/private/credentials` — room access, revealed only to
 * participating teams + admins (enforced by Firestore Rules).
 */
export interface MatchCredentials {
  roomId: string;
  password: string;
}
