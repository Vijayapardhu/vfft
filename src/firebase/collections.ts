import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  collection,
  doc,
} from "firebase/firestore";
import { db } from "./firestore";
import type {
  Achievement,
  Announcement,
  Auction,
  AuditLog,
  Bid,
  CachedPlayerStandings,
  CachedTeamStandings,
  Dispute,
  GalleryItem,
  HallOfFame,
  HomeContent,
  Lineup,
  MarqueeItem,
  Match,
  MatchCredentials,
  NewsArticle,
  Notification,
  Player,
  PlayerContact,
  PlayerMatchStats,
  PlayerSeasonStats,
  Result,
  ResultEvidence,
  Season,
  Sponsor,
  Substitution,
  Team,
  TeamSeasonStats,
  Transfer,
  User,
  Weapon,
  WebsiteSettings,
} from "@/types";

/** Canonical Firestore collection names (TRD §9 / SRS §33 / ADB §8). */
export const COLLECTIONS = {
  users: "users",
  players: "players",
  teams: "teams",
  matches: "matches",
  lineups: "lineups",
  results: "results",
  playerMatchStats: "playerMatchStats",
  teamSeasonStats: "teamSeasonStats",
  playerSeasonStats: "playerSeasonStats",
  auctions: "auctions",
  bids: "bids",
  substitutions: "substitutions",
  transfers: "transfers",
  disputes: "disputes",
  auditLogs: "auditLogs",
  notifications: "notifications",
  announcements: "announcements",
  gallery: "gallery",
  hallOfFame: "hallOfFame",
  achievements: "achievements",
  cachedLeaderboards: "cachedLeaderboards",
  cachedPlayerStandings: "cachedPlayerStandings",
  cachedTeamStandings: "cachedTeamStandings",
  seasons: "seasons",
  resultEvidence: "resultEvidence",
  homeContent: "homeContent",
  settings: "settings",
  marquee: "marquee",
  news: "news",
  sponsors: "sponsors",
  weapons: "weapons",
} as const;

/** Identity converter that preserves the document shape as <T>. */
function converter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: T) => data as DocumentData,
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
  };
}

/** A typed collection reference. */
export function typedCollection<T>(name: string) {
  return collection(db, name).withConverter(converter<T>());
}

/** A typed document reference within a collection. */
export function typedDoc<T>(name: string, id: string) {
  return doc(db, name, id).withConverter(converter<T>());
}

// --- Convenience typed accessors --------------------------------------------
export const usersCol = () => typedCollection<User>(COLLECTIONS.users);
export const playersCol = () => typedCollection<Player>(COLLECTIONS.players);
export const teamsCol = () => typedCollection<Team>(COLLECTIONS.teams);
export const matchesCol = () => typedCollection<Match>(COLLECTIONS.matches);
export const lineupsCol = () => typedCollection<Lineup>(COLLECTIONS.lineups);
export const resultsCol = () => typedCollection<Result>(COLLECTIONS.results);
export const resultEvidenceCol = () =>
  typedCollection<ResultEvidence>(COLLECTIONS.resultEvidence);
export const playerMatchStatsCol = () =>
  typedCollection<PlayerMatchStats>(COLLECTIONS.playerMatchStats);
export const teamSeasonStatsCol = () =>
  typedCollection<TeamSeasonStats>(COLLECTIONS.teamSeasonStats);
export const playerSeasonStatsCol = () =>
  typedCollection<PlayerSeasonStats>(COLLECTIONS.playerSeasonStats);
export const auctionsCol = () => typedCollection<Auction>(COLLECTIONS.auctions);
export const bidsCol = () => typedCollection<Bid>(COLLECTIONS.bids);
export const substitutionsCol = () =>
  typedCollection<Substitution>(COLLECTIONS.substitutions);
export const transfersCol = () => typedCollection<Transfer>(COLLECTIONS.transfers);
export const disputesCol = () => typedCollection<Dispute>(COLLECTIONS.disputes);
export const auditLogsCol = () => typedCollection<AuditLog>(COLLECTIONS.auditLogs);
export const notificationsCol = () =>
  typedCollection<Notification>(COLLECTIONS.notifications);
export const announcementsCol = () =>
  typedCollection<Announcement>(COLLECTIONS.announcements);
export const galleryCol = () => typedCollection<GalleryItem>(COLLECTIONS.gallery);
export const hallOfFameCol = () =>
  typedCollection<HallOfFame>(COLLECTIONS.hallOfFame);
export const achievementsCol = () =>
  typedCollection<Achievement>(COLLECTIONS.achievements);
export const seasonsCol = () => typedCollection<Season>(COLLECTIONS.seasons);
export const cachedTeamStandingsCol = () =>
  typedCollection<CachedTeamStandings>(COLLECTIONS.cachedTeamStandings);
export const cachedPlayerStandingsCol = () =>
  typedCollection<CachedPlayerStandings>(COLLECTIONS.cachedPlayerStandings);

// --- Convenience typed document accessors -----------------------------------
export const playerDoc = (id: string) =>
  typedDoc<Player>(COLLECTIONS.players, id);
/** Private PII subdocument for a player: players/{id}/private/contact. */
export const playerContactDoc = (playerId: string) =>
  doc(db, COLLECTIONS.players, playerId, "private", "contact").withConverter(
    converter<PlayerContact>(),
  );
export const teamDoc = (id: string) => typedDoc<Team>(COLLECTIONS.teams, id);
export const matchDoc = (id: string) =>
  typedDoc<Match>(COLLECTIONS.matches, id);
/** Private room credentials: matches/{id}/private/credentials. */
export const matchCredentialsDoc = (matchId: string) =>
  doc(db, COLLECTIONS.matches, matchId, "private", "credentials").withConverter(
    converter<MatchCredentials>(),
  );
export const seasonDoc = (id: string) =>
  typedDoc<Season>(COLLECTIONS.seasons, id);

// --- New CMS collections -------------------------------------------------

export const homeContentDoc = () =>
  doc(db, COLLECTIONS.homeContent, "site").withConverter(converter<HomeContent>());

export const settingsDoc = () =>
  doc(db, COLLECTIONS.settings, "site").withConverter(converter<WebsiteSettings>());

export const marqueeCol = () =>
  typedCollection<MarqueeItem>(COLLECTIONS.marquee);

export const newsCol = () =>
  typedCollection<NewsArticle>(COLLECTIONS.news);

export const newsDoc = (id: string) =>
  typedDoc<NewsArticle>(COLLECTIONS.news, id);

export const sponsorsCol = () =>
  typedCollection<Sponsor>(COLLECTIONS.sponsors);

export const sponsorDoc = (id: string) =>
  typedDoc<Sponsor>(COLLECTIONS.sponsors, id);

export const weaponsCol = () =>
  typedCollection<Weapon>(COLLECTIONS.weapons);

export const weaponDoc = (id: string) =>
  typedDoc<Weapon>(COLLECTIONS.weapons, id);
