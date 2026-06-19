import { create } from "zustand";
import type { Season, WithId } from "@/types";

interface SeasonState {
  activeSeason: WithId<Season> | null;
  loading: boolean;
  setActiveSeason: (season: WithId<Season> | null) => void;
}

/** Holds the currently active season so the whole app scopes data correctly. */
export const useSeasonStore = create<SeasonState>((set) => ({
  activeSeason: null,
  loading: true,
  setActiveSeason: (activeSeason) => set({ activeSeason, loading: false }),
}));
