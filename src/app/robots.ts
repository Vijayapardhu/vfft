import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vfft.vercel.app";

/**
 * /robots.txt — crawlers may index all public content; private/authed areas
 * (admin console, API routes, account + franchise management) are off-limits.
 * Public team pages live at /team/[slug], so only the authed /team/* subpages
 * are disallowed (not the whole /team prefix).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/profile",
        "/notifications",
        "/franchise",
        "/team/manage",
        "/team/lineup",
        "/team/squad",
        "/team/history",
        "/login",
        "/register",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
