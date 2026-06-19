import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // firebase-admin (and its Google deps) must NOT be bundled by Next — they ship
  // CJS that breaks with "require() of ES Module" inside the Vercel lambda when
  // the project is `"type": "module"`. Externalizing lets Node load them natively.
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@grpc/grpc-js",
    "google-gax",
    "google-auth-library",
    "farmhash-modern",
  ],
  // Allow building into an alternate output dir (set NEXT_DIST_DIR) so a
  // production build doesn't contend with a running `next dev` over `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The user's home directory is also a git repo with its own lockfile, which
  // Next would otherwise infer as the workspace root (breaking type resolution
  // and Vercel file tracing). Pin the root to THIS project.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      // Cloudinary-hosted media (players, teams, banners, gallery, evidence...)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google account profile photos returned by Google Sign-In
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
