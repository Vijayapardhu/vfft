import type { Timestamp } from "firebase/firestore";

export interface NewsArticle {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  category: "match" | "announcement" | "update" | "highlight" | "general";
  publishedAt: Timestamp | null;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
