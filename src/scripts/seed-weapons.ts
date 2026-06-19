/**
 * Seed weapons from constants into Firestore.
 *
 * Usage:
 *   npx tsx src/scripts/seed-weapons.ts
 *
 * Uses FIREBASE_SERVICE_ACCOUNT_B64 from environment.
 */
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { FF_WEAPONS } from "../constants/weapons";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const B64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

if (!PROJECT_ID) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID not set");
if (!B64) throw new Error("FIREBASE_SERVICE_ACCOUNT_B64 not set");

const app =
  getApps().length === 0
    ? initializeApp({
        projectId: PROJECT_ID,
        credential: cert(JSON.parse(Buffer.from(B64, "base64").toString("utf8"))),
      })
    : getApp();

const db = getFirestore(app);

async function seed() {
  console.log(`Seeding ${FF_WEAPONS.length} weapons...\n`);
  let created = 0;
  let skipped = 0;

  for (const w of FF_WEAPONS) {
    const existing = await db.collection("weapons").where("id", "==", w.id).limit(1).get();
    if (existing.empty) {
      await db.collection("weapons").add({ id: w.id, name: w.name, category: w.category, createdAt: new Date() });
      console.log(`  ✓ ${w.id} — ${w.name} (${w.category})`);
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped (already exist): ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
