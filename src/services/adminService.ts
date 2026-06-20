"use client";

import { apiPost } from "./apiClient";

/** Approve/reject a player (sets status + links the owning user's role). */
export function reviewPlayer(
  playerId: string,
  action: "approve" | "reject",
  reason?: string,
) {
  return apiPost<{ ok: true }>("/api/admin/player/approve", {
    playerId,
    action,
    reason,
  });
}

/** Approve/reject a transfer (enforces limits + purse server-side). */
export function processTransfer(transferId: string, action: "approve" | "reject") {
  return apiPost<{ ok: true; status: string }>("/api/admin/transfer", {
    transferId,
    action,
  });
}

/** Approve/reject an emergency substitution (applies the lineup swap server-side). */
export function processSubstitution(
  substitutionId: string,
  action: "approve" | "reject",
) {
  return apiPost<{ ok: true; status: string }>("/api/admin/substitution", {
    substitutionId,
    action,
  });
}

/** Approve (locks) or reject a team's submitted match-day lineup. */
export function processLineup(
  lineupId: string,
  action: "approve" | "reject",
  reason?: string,
) {
  return apiPost<{ ok: true }>("/api/admin/lineup", { lineupId, action, reason });
}

/** Set a match's status and broadcast it live to the Realtime Database. */
export function setMatchLiveState(
  matchId: string,
  status: "upcoming" | "live" | "completed",
) {
  return apiPost<{ ok: true }>("/api/admin/match/state", { matchId, status });
}

/** Send a notification (in-app + RTDB inbox + FCM push). Omit userId to broadcast. */
export function sendNotification(input: {
  userId?: string;
  type?: string;
  title: string;
  body: string;
  href?: string;
  imageUrl?: string;
}) {
  return apiPost<{ ok: true; id: string }>("/api/admin/notify", input);
}

/** Recompute & award season achievements from stats. */
export function recomputeAchievements(seasonId: string) {
  return apiPost<{ ok: true; awarded: number }>(
    "/api/admin/achievements/recompute",
    { seasonId },
  );
}

/** Auto-generate league fixtures (round-robin) for a season. */
export function generateFixtures(input: {
  seasonId: string;
  format: "single" | "double" | "triple";
  startAt?: number;
  intervalMinutes?: number;
  map?: string;
}) {
  return apiPost<{ ok: true; count: number }>(
    "/api/admin/fixtures/generate",
    input,
  );
}

/** Generate the IPL-style playoff bracket (Q1/Eliminator/Q2/Final) from the top-4 standings. */
export function generatePlayoffs(input: {
  seasonId: string;
  startAt?: number;
  intervalMinutes?: number;
  map?: string;
}) {
  return apiPost<{ ok: true; count: number }>("/api/admin/fixtures/playoffs", {
    ...input,
    action: "generate",
  });
}

/** Fill playoff placeholders (Q2/Final) from results so far. Idempotent. */
export function advancePlayoffs(seasonId: string) {
  return apiPost<{ ok: true; advanced: string[] }>("/api/admin/fixtures/playoffs", {
    seasonId,
    action: "advance",
  });
}
