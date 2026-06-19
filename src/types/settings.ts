import type { Timestamp } from "firebase/firestore";

export interface WebsiteSettings {
  websiteLogo: string;
  favicon: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  seasonName: string;
  prizePool: string;
  startDate: string;
  endDate: string;
  socialLinks: {
    instagram: string;
    whatsapp: string;
    youtube: string;
    discord?: string;
    website?: string;
  };
  updatedAt: Timestamp | null;
  updatedBy: string | null;
}
