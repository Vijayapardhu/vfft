import type { Timestamp } from "firebase/firestore";

export interface Sponsor {
  name: string;
  logoUrl: string;
  website: string;
  priority: number;
  isActive: boolean;
  createdAt: Timestamp;
}
