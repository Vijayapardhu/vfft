import { LINEUP_LOCK_MINUTES_BEFORE } from "@/constants/app";

/** How long before kickoff the lineup window opens / reminders fire (ms). */
export const LINEUP_WINDOW_MS = LINEUP_LOCK_MINUTES_BEFORE * 60_000;

export interface LineupWindow {
  /** Kickoff time in ms (null if the match has no scheduled time). */
  kickoffMs: number | null;
  /** When the lineup window opens — 30 min before kickoff. */
  opensAtMs: number | null;
  /** True while team leaders may still submit/edit their lineup. */
  isOpen: boolean;
  /** True once submissions are closed (kickoff passed or match not upcoming). */
  isClosed: boolean;
  /** True when the window hasn't opened yet (>30 min before kickoff). */
  notYetOpen: boolean;
}

/**
 * Compute the match-day lineup submission window (PRD "Match-Day Lineups").
 * Pure + side-effect free so it can run identically on the client (LineupManager)
 * and the server (the team lineup route guard). Submissions are editable while
 * the match is "upcoming" and kickoff hasn't passed; they lock at kickoff.
 */
export function lineupWindow(
  kickoffMs: number | null,
  status: string,
  nowMs: number,
): LineupWindow {
  const closedByStatus = status !== "upcoming";
  if (kickoffMs == null) {
    return {
      kickoffMs: null,
      opensAtMs: null,
      isOpen: !closedByStatus,
      isClosed: closedByStatus,
      notYetOpen: false,
    };
  }
  const opensAtMs = kickoffMs - LINEUP_WINDOW_MS;
  const isClosed = closedByStatus || nowMs >= kickoffMs;
  return {
    kickoffMs,
    opensAtMs,
    isOpen: !isClosed,
    isClosed,
    notYetOpen: !isClosed && nowMs < opensAtMs,
  };
}
