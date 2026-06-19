import type { DisputeStatus, Timestamp, Timestamps } from "./common";

/**
 * `disputes/{disputeId}` — raised by team leaders (SRS §23 / TRD §21).
 * Flow: open → underReview → resolved → closed. Admin must supply resolution
 * notes and evidence references when resolving.
 */
export interface Dispute extends Timestamps {
  seasonId: string;
  matchId: string;

  raisedBy: string;
  reason: string;

  status: DisputeStatus;
  resolutionNotes?: string;
  evidenceId?: string;

  resolvedBy?: string;
  resolvedAt?: Timestamp;
}
