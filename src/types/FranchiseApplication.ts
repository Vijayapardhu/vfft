import type { Timestamp } from "firebase/firestore";

export type FranchiseApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "correction";

/**
 * `franchiseApplications/{id}` — submitted when a user wants to own a franchise.
 * Admin reviews and approves (creating the team) or rejects.
 */
export interface FranchiseApplication {
  applicantUid: string;

  // Personal info
  fullName: string;
  ign: string;
  phone: string;
  email: string;
  city: string;

  // Team branding
  desiredTeamName: string;
  slogan: string;
  shortName: string;
  teamColor: string;

  // Background
  motivation: string;
  previousExperience?: string;
  instagram?: string;
  logoUrl?: string;
  bannerIdea?: string;

  // Payment proof
  screenshotUrl: string;
  feeAmount: number;

  // Review outcome
  status: FranchiseApplicationStatus;
  rejectedReason?: string;
  correctionNote?: string;

  // Set after approval
  teamId?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
