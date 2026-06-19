import type { Timestamp } from "firebase/firestore";

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  featuredMatchId: string | null;
  featuredPlayerIds: string[];
  featuredTeamIds: string[];
  announcements: string[];
  sponsorsLogo: string[];
  marqueeText: string;
  updatedAt: Timestamp | null;
  updatedBy: string | null;
}
