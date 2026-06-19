import type { ApprovalStatus, Timestamp, Timestamps } from "./common";

/**
 * `lineups/{lineupId}` — a team's match-day submission (SRS §8).
 * Submitted ≤30 min before kickoff; locks once an admin approves.
 */
export interface Lineup extends Timestamps {
  seasonId: string;
  matchId: string;
  teamId: string;

  /** Exactly PLAYING_SQUAD_SIZE (4) player ids. */
  playingFour: string[];
  captainId: string;
  viceCaptainId: string;

  status: ApprovalStatus;
  locked: boolean;

  submittedBy: string;
  submittedAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectedReason?: string;
}
