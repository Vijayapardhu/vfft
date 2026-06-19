import type { Timestamp } from "firebase/firestore";

export type { Timestamp };

/** Standard audit timestamps present on most documents. */
export interface Timestamps {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** A stored document combined with its Firestore document id. */
export type WithId<T> = T & { id: string };

// --- Role & status unions (single source of truth for the domain) ----------

/** Account roles (TRD §6 / SRS §2). */
export type UserRole = "admin" | "franchiseOwner" | "teamLeader" | "player" | "guest";

/** Player in-game roles (SRS §4). */
export type PlayerRole = "rusher" | "sniper" | "support" | "igl";

/** Approval lifecycle shared by players, lineups, substitutions (SRS §4/§8/§22). */
export type ApprovalStatus = "pending" | "approved" | "rejected";

/** Player account lifecycle — approval states plus admin suspension. */
export type PlayerStatus = ApprovalStatus | "suspended";

/** Match lifecycle (SRS §9). */
export type MatchStatus = "upcoming" | "live" | "completed";

/** Tournament stage (SRS §10 fixture generator). */
export type MatchStage =
  | "league"
  | "qualifier1"
  | "eliminator"
  | "qualifier2"
  | "final";

/** Fixture formats supported by the generator (SRS §10). */
export type FixtureFormat = "singleRoundRobin" | "doubleRoundRobin" | "playoffs";

/** Auction lifecycle (SRS §6). */
export type AuctionStatus = "upcoming" | "active" | "sold" | "unsold";

/** Dispute lifecycle (SRS §23 / TRD §21). */
export type DisputeStatus = "open" | "underReview" | "resolved" | "closed";

/** Season lifecycle (SRS §27). */
export type SeasonStatus = "upcoming" | "active" | "completed";

/** Transfer kinds (SRS §21). */
export type TransferType = "buy" | "sell" | "trade";
