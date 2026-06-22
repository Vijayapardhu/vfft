import type {
  CachedPlayerStanding,
  CachedTeamStanding,
  Player,
  PlayerMatchStats,
  Result,
  Team,
  WithId,
} from "@/types";

/**
 * Derive team standings from the `results` collection (SRS §14).
 * Pure + deterministic so it can be unit-tested and later mirrored by the
 * Cloud Function that writes `cachedTeamStandings` (TRD §19).
 */
export function computeTeamStandings(
  results: WithId<Result>[],
  teams: WithId<Team>[],
): CachedTeamStanding[] {
  type Agg = {
    matchesPlayed: number;
    wins: number;
    losses: number;
    kills: number;
    damage: number;
    roundsWon: number;
    roundsLost: number;
  };
  const newAgg = (): Agg => ({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    damage: 0,
    roundsWon: 0,
    roundsLost: 0,
  });
  const byTeam = new Map<string, Agg>();

  for (const r of results) {
    const agg = byTeam.get(r.teamId) ?? newAgg();
    agg.matchesPlayed += 1;
    agg.kills += r.kills ?? 0;
    agg.damage += r.damage ?? 0;
    agg.roundsWon += r.roundsWon ?? 0;
    agg.roundsLost += r.roundsLost ?? 0;
    if (r.outcome === "win") agg.wins += 1;
    if (r.outcome === "loss") agg.losses += 1;
    byTeam.set(r.teamId, agg);
  }

  const rows: CachedTeamStanding[] = teams.map((t) => {
    const agg = byTeam.get(t.id) ?? newAgg();
    // NDR (Net Damage Rate) = average team damage per match played.
    const ndr = Math.round(agg.damage / Math.max(1, agg.matchesPlayed));
    return {
      rank: 0,
      teamId: t.id,
      teamName: t.name,
      logoUrl: t.logoUrl,
      ndr,
      // Points = number of wins; round difference is the primary tiebreaker.
      points: agg.wins,
      roundDiff: agg.roundsWon - agg.roundsLost,
      ...agg,
    };
  });

  // Ranking: WINS (points) primary, then ROUND DIFFERENCE, then DAMAGE, then
  // kills, then name. (Kills stay a stat / "most kills" recognition.)
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.roundDiff - a.roundDiff ||
      b.damage - a.damage ||
      b.kills - a.kills ||
      a.teamName.localeCompare(b.teamName),
  );
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}

/** Metrics a player leaderboard can be ranked by (SRS §15). */
export type PlayerStandingMetric =
  | "performanceScore"
  | "kills"
  | "headshots"
  | "damage"
  | "mvpAwards";

/**
 * Overall performance score from a player's season totals. Rewards impact —
 * kills, assists, knockdowns, headshots, MVPs and damage — with a small penalty
 * for deaths. Drives the auto "Overall" rank on the leaderboard + profiles.
 */
export function playerPerformanceScore(s: {
  kills: number;
  deaths: number;
  assists: number;
  knockdowns: number;
  headshots: number;
  damage: number;
  mvpAwards: number;
}): number {
  return Math.max(
    0,
    s.kills * 2 +
      s.assists +
      s.knockdowns +
      s.headshots +
      s.mvpAwards * 4 +
      Math.round(s.damage / 100) -
      s.deaths,
  );
}

/**
 * Derive player standings from `playerMatchStats` (SRS §15). Returns one row
 * per player who has recorded stats; ranking is applied by the caller for the
 * selected metric.
 */
export function computePlayerStandings(
  stats: WithId<PlayerMatchStats>[],
  players: WithId<Player>[],
  teams: WithId<Team>[],
): CachedPlayerStanding[] {
  type Agg = {
    kills: number;
    deaths: number;
    assists: number;
    knockdowns: number;
    headshots: number;
    damage: number;
    mvpAwards: number;
    matches: Set<string>;
    teamId: string;
  };
  const byPlayer = new Map<string, Agg>();

  for (const s of stats) {
    const agg =
      byPlayer.get(s.playerId) ??
      {
        kills: 0,
        deaths: 0,
        assists: 0,
        knockdowns: 0,
        headshots: 0,
        damage: 0,
        mvpAwards: 0,
        matches: new Set<string>(),
        teamId: s.teamId,
      };
    agg.kills += s.kills ?? 0;
    agg.deaths += s.deaths ?? 0;
    agg.assists += s.assists ?? 0;
    agg.knockdowns += s.knockdowns ?? 0;
    agg.headshots += s.headshots ?? 0;
    agg.damage += s.damage ?? 0;
    if (s.mvp) agg.mvpAwards += 1;
    if (s.matchId) agg.matches.add(s.matchId);
    byPlayer.set(s.playerId, agg);
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const teamName = (id: string | undefined) =>
    teams.find((t) => t.id === id)?.name ?? "—";

  return [...byPlayer.entries()].map(([playerId, agg]) => {
    const p = playerById.get(playerId);
    const teamId = p?.teamId ?? agg.teamId;
    return {
      rank: 0,
      playerId,
      ign: p?.ign ?? "Unknown",
      photoURL: p?.photoURL ?? null,
      teamId,
      teamName: teamName(teamId),
      matchesPlayed: agg.matches.size,
      kills: agg.kills,
      deaths: agg.deaths,
      assists: agg.assists,
      knockdowns: agg.knockdowns,
      headshots: agg.headshots,
      damage: agg.damage,
      mvpAwards: agg.mvpAwards,
      performanceScore: playerPerformanceScore(agg),
    };
  });
}

/** Sort player rows by a metric (desc) and assign 1-based ranks. */
export function rankPlayers(
  rows: CachedPlayerStanding[],
  metric: PlayerStandingMetric,
): CachedPlayerStanding[] {
  const sorted = rows
    .slice()
    .sort((a, b) => b[metric] - a[metric] || b.kills - a.kills || a.ign.localeCompare(b.ign));
  sorted.forEach((r, i) => {
    r.rank = i + 1;
  });
  return sorted;
}
