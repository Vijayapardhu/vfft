import type { UserRole } from "@/types/common";

/** String constants for the account roles (TRD §6). */
export const USER_ROLES = {
  ADMIN: "admin",
  FRANCHISE_OWNER: "franchiseOwner",
  TEAM_LEADER: "teamLeader",
  PLAYER: "player",
  GUEST: "guest",
} as const satisfies Record<string, UserRole>;

/** Human-readable labels. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  franchiseOwner: "Franchise Owner",
  teamLeader: "Team Leader",
  player: "Player",
  guest: "Guest",
};

/**
 * Privilege ordering (higher = more access). Used for coarse-grained gating;
 * fine-grained authorization is ALWAYS enforced server-side by Firestore
 * Rules and Cloud Functions — the client never decides anything important.
 */
export const ROLE_RANK: Record<UserRole, number> = {
  guest: 0,
  player: 1,
  teamLeader: 2,
  franchiseOwner: 3,
  admin: 4,
};

export function hasAtLeastRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}
