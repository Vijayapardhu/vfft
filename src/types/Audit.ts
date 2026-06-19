import type { Timestamp } from "./common";

/**
 * Fields permitted to appear in audit before/after diffs (TRD §20).
 * PII (name, email, phone, whatsappNumber, photoURL) is FORBIDDEN.
 */
export type AuditableField =
  | "kills"
  | "points"
  | "status"
  | "soldPrice"
  | "remainingPurse"
  | "wins"
  | "losses"
  | "mvp";

export type AuditDiff = Partial<Record<AuditableField, string | number | boolean | null>>;

/**
 * `auditLogs/{id}` — immutable record of sensitive changes (SRS §28 / TRD §20).
 * Append-only; written by Cloud Functions. Contains no PII.
 */
export interface AuditLog {
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  timestamp: Timestamp;
  beforeState: AuditDiff;
  afterState: AuditDiff;
}
