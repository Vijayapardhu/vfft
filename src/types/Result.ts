import type { Timestamp, Timestamps } from "./common";

/**
 * `resultEvidence/{evidenceId}` — proof screenshot (TRD §18).
 * No result or player stat may exist without a referenced evidence record.
 */
export interface ResultEvidence extends Timestamps {
  matchId: string;
  screenshotUrl: string; // Cloudinary: vfft/match-evidence
  uploadedBy: string;
  uploadedAt: Timestamp;
}

/**
 * `results/{resultId}` — a team's outcome in a match (SRS §11).
 * Written by admin via Cloud Functions; updates standings automatically.
 */
export interface Result extends Timestamps {
  seasonId: string;
  matchId: string;
  teamId: string;

  kills: number;
  /** Win-based points (1 for a win, 0 for a loss). */
  totalPoints: number;
  outcome?: "win" | "loss";
  /** Clash-Squad round score: rounds this team won / lost in the match. */
  roundsWon?: number;
  roundsLost?: number;
  /** Legacy placement scoring (no longer entered; kept for old records). */
  placementPoints?: number;
  placement?: number;
  /** Team total damage for the match — secondary standings tiebreaker. */
  damage?: number;

  /** Required link to resultEvidence (TRD §17). */
  evidenceId: string;

  enteredBy: string;
}
