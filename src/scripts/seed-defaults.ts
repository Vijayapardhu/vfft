/**
 * Seed default CMS documents so the public pages have initial data.
 *
 * Usage:
 *   npx tsx src/scripts/seed-defaults.ts
 *
 * Requires Firebase Admin SDK credentials (service account) in
 * GOOGLE_APPLICATION_CREDENTIALS or firebase Admin SDK configured.
 */

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!PROJECT_ID) {
  console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in .env");
  process.exit(1);
}

const app =
  getApps().length === 0
    ? initializeApp({
        projectId: PROJECT_ID,
        ...(process.env.GOOGLE_APPLICATION_CREDENTIALS
          ? { credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) }
          : {}),
      })
    : getApp();

const db = getFirestore(app);

async function seed() {
  console.log("Seeding default CMS documents...\n");

  // --- Home Content --------------------------------------------------------
  const homeRef = db.collection("homeContent").doc("site");
  const homeSnap = await homeRef.get();
  if (!homeSnap.exists) {
    await homeRef.set({
      heroTitle: "Where\nVillage Legends\nRise",
      heroSubtitle:
        "An IPL-style Free Fire esports platform. Player auctions, franchise squads, live leaderboards, and a Hall of Fame — built mobile-first.",
      heroImage: "",
      featuredMatchId: null,
      featuredPlayerIds: [],
      featuredTeamIds: [],
      announcements: ["Welcome to VFFT Season 1!", "Player auctions are now open"],
      sponsorsLogo: [],
      marqueeText: "Welcome to VFFT • Season 1 is live • Player auctions are open",
      updatedAt: null,
      updatedBy: null,
    });
    console.log("  ✓ homeContent/site created");
  } else {
    console.log("  - homeContent/site already exists, skipping");
  }

  // --- Settings ------------------------------------------------------------
  const settingsRef = db.collection("settings").doc("site");
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      websiteLogo: "",
      favicon: "",
      themeColors: {
        primary: "#FFD93D",
        secondary: "#FF6B6B",
        accent: "#C4B5FD",
        background: "#FFFDF5",
        text: "#000000",
      },
      seasonName: "Season 1",
      prizePool: "₹10,000",
      startDate: "",
      endDate: "",
      socialLinks: {
        instagram: "",
        whatsapp: "",
        youtube: "",
        discord: "",
        website: "",
      },
      updatedAt: null,
      updatedBy: null,
    });
    console.log("  ✓ settings/site created");
  } else {
    console.log("  - settings/site already exists, skipping");
  }

  // --- Marquee items -------------------------------------------------------
  const marqueeSnapshot = await db.collection("marquee").limit(1).get();
  if (marqueeSnapshot.empty) {
    const marqueeData = [
      { text: "Welcome to VFFT — Velangi Free Fire Tournament", isActive: true, order: 0 },
      { text: "Season 1 is now live!", isActive: true, order: 1 },
      { text: "Player auctions are open — register now", isActive: true, order: 2 },
    ];
    for (const item of marqueeData) {
      await db.collection("marquee").add({
        ...item,
        createdAt: new Date(),
      });
    }
    console.log("  ✓ marquee items created (3 items)");
  } else {
    console.log("  - marquee already has items, skipping");
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
