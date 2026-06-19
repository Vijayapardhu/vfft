import type { Timestamp } from "@/types";

/** Format a Firestore timestamp for match schedules (IST-friendly, en-IN). */
export function formatMatchTime(ts?: Timestamp | null): string {
  if (!ts) return "TBD";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(ts.toDate());
  } catch {
    return "TBD";
  }
}

/** Compact number formatting (e.g. 1,234 → "1,234"). */
export function formatNumber(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("en-IN");
}
