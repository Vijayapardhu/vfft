import {
  Crown,
  Gavel,
  Home,
  Info,
  Newspaper,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AUCTION_ROUTE, ROUTES } from "./routes";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Full desktop navigation (UID §6 desktop sidebar / top nav). */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: ROUTES.home, icon: Home },
  { label: "Matches", href: ROUTES.matches, icon: Swords },
  { label: "Teams", href: ROUTES.teams, icon: Shield },
  { label: "Players", href: ROUTES.players, icon: Users },
  { label: "Auction", href: AUCTION_ROUTE, icon: Gavel },
  { label: "Ranks", href: ROUTES.leaderboard, icon: Trophy },
  { label: "Records", href: ROUTES.records, icon: Zap },
  { label: "Hall of Fame", href: ROUTES.hallOfFame, icon: Crown },
  { label: "News", href: ROUTES.news, icon: Newspaper },
  { label: "Rules", href: ROUTES.rules, icon: ScrollText },
];

/** Four primary destinations for the mobile bottom bar (UID §6); 5th slot = More. */
export const MOBILE_PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: ROUTES.home, icon: Home },
  { label: "Matches", href: ROUTES.matches, icon: Swords },
  { label: "Teams", href: ROUTES.teams, icon: Shield },
  { label: "Ranks", href: ROUTES.leaderboard, icon: Trophy },
];

/** Overflow items revealed by the bottom-bar "More" button. */
export const MOBILE_MORE_NAV: NavItem[] = [
  { label: "Players", href: ROUTES.players, icon: Users },
  { label: "Auction", href: AUCTION_ROUTE, icon: Gavel },
  { label: "Hall of Fame", href: ROUTES.hallOfFame, icon: Crown },
  { label: "Records", href: ROUTES.records, icon: Zap },
  { label: "Story Card", href: ROUTES.storyGenerator, icon: Sparkles },
  { label: "News", href: ROUTES.news, icon: Newspaper },
  { label: "Rules", href: ROUTES.rules, icon: ScrollText },
  { label: "About", href: ROUTES.about, icon: Info },
];
