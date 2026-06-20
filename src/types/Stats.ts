import type { Timestamp, Timestamps } from "./common";

/**
 * `playerMatchStats/{id}` — per-player, per-match stats (SRS §12).
 * Every record MUST reference evidence (TRD §17). Source of player leaderboards.
 */
export interface PlayerMatchStats extends Timestamps {
  seasonId: string;
  matchId: string;
  playerId: string;
  teamId: string;

  kills: number;
  headshots: number;
  damage: number;
  mvp: boolean;

  /** Extra per-player detail captured from the post-match scoreboard. */
  deaths?: number;
  assists?: number;
  knockdowns?: number;
  /** Headshot rate as a percentage (0-100), straight from the scoreboard. */
  headshotRate?: number;

  /** Required link to resultEvidence. */
  evidenceId: string;
  enteredBy: string;
}

/** `teamSeasonStats/{teamId_seasonId}` — aggregated team totals. */
export interface TeamSeasonStats extends Timestamps {
  seasonId: string;
  teamId: string;

  matchesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  points: number;
}

/** `playerSeasonStats/{playerId_seasonId}` — aggregated player totals. */
export interface PlayerSeasonStats extends Timestamps {
  seasonId: string;
  playerId: string;
  teamId: string;

  matchesPlayed: number;
  kills: number;
  headshots: number;
  damage: number;
  mvpAwards: number;
}

/**
 * `cachedTeamStandings/{seasonId}` — denormalized standings written by Cloud
 * Functions for fast reads (TRD §19). Never written by clients.
 */
export interface CachedTeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  /** Total team damage across the season. */
  damage: number;
  /** Net Damage Rate — average team damage per match (tiebreaker). */
  ndr: number;
  points: number;
}

export interface CachedTeamStandings extends Timestamps {
  seasonId: string;
  standings: CachedTeamStanding[];
  computedAt: Timestamp;
}

/** `cachedPlayerStandings/{seasonId}` — denormalized player leaderboards. */
export interface CachedPlayerStanding {
  rank: number;
  playerId: string;
  ign: string;
  photoURL: string | null;
  teamId: string;
  teamName: string;
  kills: number;
  headshots: number;
  damage: number;
  mvpAwards: number;
}

export interface CachedPlayerStandings extends Timestamps {
  seasonId: string;
  standings: CachedPlayerStanding[];
  computedAt: Timestamp;
}
