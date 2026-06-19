"use client";

import { apiPost } from "./apiClient";

/** Team leader submits a match-day lineup (server validates squad + ownership). */
export function submitLineup(input: {
  matchId: string;
  playingFour: string[];
  captainId: string;
  viceCaptainId: string;
}) {
  return apiPost<{ ok: true; lineupId: string }>("/api/team/lineup", input);
}

/** Admin approves (locks) or rejects a submitted lineup. */
export function reviewLineup(
  lineupId: string,
  action: "approve" | "reject",
  reason?: string,
) {
  return apiPost<{ ok: true }>("/api/admin/lineup", { lineupId, action, reason });
}

/** Admin pings both teams in a fixture to submit their match-day lineup. */
export function remindLineup(matchId: string) {
  return apiPost<{ ok: true; notified: number }>(
    "/api/admin/lineup/remind",
    { matchId },
  );
}
