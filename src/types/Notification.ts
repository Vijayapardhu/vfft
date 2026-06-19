import type { Timestamp, Timestamps } from "./common";

export type NotificationType =
  | "matchReminder"
  | "auctionStart"
  | "scheduleChange"
  | "lineupApproved"
  | "resultsPublished"
  | "teamConfirmation"
  | "general";

/** `notifications/{id}` — per-user in-app + push notification (SRS §24). */
export interface Notification extends Timestamps {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  /** Optional deep-link target. */
  href?: string;
  data?: Record<string, string>;
}

export type AnnouncementType =
  | "announcement"
  | "matchReport"
  | "winnerPost"
  | "seasonUpdate";

/** `announcements/{id}` — admin-published news (SRS §25). */
export interface Announcement extends Timestamps {
  seasonId?: string;
  type: AnnouncementType;
  title: string;
  body: string;
  imageUrl?: string;
  publishedBy: string;
  publishedAt: Timestamp;
}
