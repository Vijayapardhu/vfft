/**
 * Canonical route map (TRD §11 / UID §7). Use these constants everywhere
 * instead of hard-coded strings so links stay consistent and refactorable.
 */
export const ROUTES = {
  // --- Public ---
  home: "/",
  teams: "/teams",
  team: (id: string) => `/teams/${id}`,
  players: "/players",
  player: (id: string) => `/players/${id}`,
  matches: "/matches",
  match: (id: string) => `/matches/${id}`,
  leaderboard: "/leaderboard",
  news: "/news",
  rules: "/rules",
  hallOfFame: "/hall-of-fame",
  about: "/about",

  // --- Auth ---
  login: "/login",

  // --- Player ---
  dashboard: "/dashboard",
  profile: "/profile",
  editProfile: "/edit-profile",
  myTeam: "/my-team",
  myMatches: "/my-matches",
  achievements: "/achievements",
  notifications: "/notifications",
  register: "/register",

  // --- Team leader ---
  teamManage: "/team/manage",
  teamLineup: "/team/lineup",
  teamSquad: "/team/squad",
  teamHistory: "/team/history",

  // --- Franchise owner ---
  franchise: "/franchise",
  franchisePlayers: "/franchise/players",
  franchiseStatistics: "/franchise/statistics",
  franchiseHistory: "/franchise/history",

  // --- Admin ---
  admin: "/admin",
  adminPlayers: "/admin/players",
  adminTeams: "/admin/teams",
  adminAuction: "/admin/auction",
  adminMatches: "/admin/matches",
  adminResults: "/admin/results",
  adminStats: "/admin/stats",
  adminGallery: "/admin/gallery",
  adminSeasons: "/admin/seasons",
  adminNotifications: "/admin/notifications",
  adminDisputes: "/admin/disputes",
  adminHallOfFame: "/admin/hall-of-fame",
} as const;

/** Public auction page (flagship spectator view, UID §15). */
export const AUCTION_ROUTE = "/auction";
