export interface AuctionCurrent {
  auctionId: string;
  playerId: string;
  playerName: string;
  playerPhoto: string | null;
  playerRole: string;
  mode: "timed" | "manual";
  basePrice: number;
  currentBid: number;
  highestBidTeamId: string | null;
  highestBidTeamName: string | null;
  status: "active" | "sold" | "unsold";
  endsAt: number | null;
  timerSeconds: number;
  soldPrice?: number;
}

export interface MatchState {
  status: "upcoming" | "live" | "completed";
  team1Score: number;
  team2Score: number;
  roomId: string;
  password: string;
  map: string;
  round: number;
  timerSeconds: number;
  scheduledAt: number;
}

export interface PresenceUser {
  displayName: string;
  photoURL: string;
  lastOnline: number;
}

export interface RealtimeNotification {
  id: string;
  title: string;
  /** Matches the server push shape (server/notify.ts → RTDB inbox). */
  body: string;
  type: string;
  read: boolean;
  ts: number;
  href?: string;
}

export interface RealtimeCountdown {
  label: string;
  targetTime: number;
  type: "auction" | "match" | "season";
  metadata?: Record<string, string>;
}

export interface FeaturedContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  featuredMatchId: string | null;
  featuredPlayerIds: string[];
  featuredTeamIds: string[];
  marqueeText: string;
}
