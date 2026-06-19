import type { Timestamp } from "firebase/firestore";

export type GalleryType = "match" | "winners" | "posters" | "teams" | "banner";

export interface BannerImage {
  imageUrl: string;
  title: string;
  link: string;
  priority: number;
  isActive: boolean;
}

export interface GalleryItem {
  title: string;
  imageUrl: string;
  type: GalleryType;
  description: string;
  /** Optional click-through URL (used by banner slides). */
  link?: string;
  uploadedAt: Timestamp;
  seasonId: string | null;
}
