"use client";

import { useSeasonStore } from "@/store/seasonStore";

/** Read the active season + its id (null until loaded / if none is active). */
export function useActiveSeason() {
  const season = useSeasonStore((s) => s.activeSeason);
  const loading = useSeasonStore((s) => s.loading);
  return { season, seasonId: season?.id ?? null, loading };
}
