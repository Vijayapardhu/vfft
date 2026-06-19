import type { Timestamp } from "firebase/firestore";

export interface HallOfFameEntry {
  seasonId: string;
  seasonName: string;
  championTeamId: string | null;
  mvpPlayerId: string | null;
  bestTeamId: string | null;
  highestKillsPlayerId: string | null;
  highestKills: number | null;
  updatedAt: Timestamp;
}

/** Alias for backward compatibility. */
export type HallOfFame = HallOfFameEntry;
