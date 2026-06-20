import type { MetadataRoute } from "next";
import { adminDb, isAdminConfigured } from "@/server/firebaseAdmin";

/** Rebuild the dynamic entries at most once an hour. */
export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vfft.vercel.app";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Freq }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "teams", priority: 0.9, changeFrequency: "daily" },
  { path: "players", priority: 0.9, changeFrequency: "daily" },
  { path: "matches", priority: 0.9, changeFrequency: "daily" },
  { path: "leaderboard", priority: 0.8, changeFrequency: "daily" },
  { path: "auction", priority: 0.7, changeFrequency: "hourly" },
  { path: "news", priority: 0.7, changeFrequency: "daily" },
  { path: "gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "hall-of-fame", priority: 0.6, changeFrequency: "weekly" },
  { path: "records", priority: 0.6, changeFrequency: "weekly" },
  { path: "rules", priority: 0.4, changeFrequency: "monthly" },
  { path: "privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "terms", priority: 0.3, changeFrequency: "yearly" },
];

/** Best-effort Firestore Timestamp → Date. */
function toDate(value: unknown): Date | undefined {
  const v = value as { toDate?: () => Date } | undefined;
  try {
    return v?.toDate?.();
  } catch {
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: r.path ? `${siteUrl}/${r.path}` : siteUrl,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Dynamic content needs the Admin SDK; if it isn't configured (fresh clone /
  // preview), fall open with just the static routes — never break the build.
  if (!isAdminConfigured) return entries;

  try {
    const db = adminDb();
    const [teamsSnap, playersSnap, newsSnap] = await Promise.all([
      db.collection("teams").get(),
      db.collection("players").where("status", "==", "approved").get(),
      db.collection("news").where("isPublished", "==", true).get(),
    ]);

    for (const d of teamsSnap.docs) {
      const slug = d.data().slug as string | undefined;
      if (!slug) continue;
      entries.push({
        url: `${siteUrl}/team/${slug}`,
        lastModified: toDate(d.data().updatedAt) ?? now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const d of playersSnap.docs) {
      const uid = d.data().uid as string | undefined;
      if (!uid) continue;
      entries.push({
        url: `${siteUrl}/player/${uid}`,
        lastModified: toDate(d.data().updatedAt) ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const d of newsSnap.docs) {
      const slug = d.data().slug as string | undefined;
      if (!slug) continue;
      entries.push({
        url: `${siteUrl}/news/${slug}`,
        lastModified: toDate(d.data().publishedAt) ?? toDate(d.data().updatedAt) ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Fail open — return whatever static (and any partial dynamic) entries we have.
  }

  return entries;
}
