import "server-only";
import { MAX_SQUAD_SIZE } from "@/constants/app";

/**
 * Roster cap for a season — `Season.squadSize` when set, else the default
 * (MAX_SQUAD_SIZE). Pass the season document's `.data()`.
 */
export function squadCapFrom(seasonData: { squadSize?: unknown } | null | undefined): number {
  const v = seasonData?.squadSize;
  return typeof v === "number" && v > 0 ? Math.min(Math.floor(v), 50) : MAX_SQUAD_SIZE;
}
