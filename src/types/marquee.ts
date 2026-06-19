import type { Timestamp } from "firebase/firestore";

export interface MarqueeItem {
  text: string;
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
}
