import type { ApprovalStatus, Timestamp, Timestamps, TransferType } from "./common";

/**
 * `transfers/{transferId}` — squad change between teams (SRS §21).
 * Max MAX_TRANSFERS_PER_SEASON per team; none during playoffs.
 * Purse deduction enforced server-side (TRD §16/§23).
 */
export interface Transfer extends Timestamps {
  seasonId: string;
  type: TransferType;
  playerId: string;

  fromTeamId?: string;
  toTeamId?: string;
  amount?: number;

  status: ApprovalStatus;
  requestedBy: string;
  processedBy?: string;
  processedAt?: Timestamp;
}

/**
 * `substitutions/{substitutionId}` — emergency player swap (SRS §22).
 * Before room start, admin-approved, replacement must already be on the team.
 * Does NOT count toward the transfer limit (TRD §24).
 */
export interface Substitution extends Timestamps {
  seasonId: string;
  matchId: string;
  teamId: string;

  outPlayerId: string;
  inPlayerId: string;
  reason: string;

  status: ApprovalStatus;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
}
