import type { Timestamp } from "firebase/firestore";

/** `pages/{slug}` — admin-editable static content (Rules, About, legal…). */
export interface PageContent {
  slug: string;
  title: string;
  /** Plain text / light markdown; rendered with preserved line breaks. */
  body: string;
  updatedAt: Timestamp | null;
  updatedBy: string | null;
}

/** The site pages an admin can edit from /admin/pages. */
export const EDITABLE_PAGES = [
  { slug: "rules", title: "Rules", href: "/rules" },
  { slug: "about", title: "About", href: "/about" },
  { slug: "privacy", title: "Privacy Policy", href: "/privacy" },
  { slug: "terms", title: "Terms of Service", href: "/terms" },
  { slug: "community", title: "Community Guidelines", href: "/community-guidelines" },
] as const;
