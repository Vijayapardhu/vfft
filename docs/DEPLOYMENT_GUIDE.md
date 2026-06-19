# DEPLOYMENT GUIDE — VFFT

Frontend + server routes deploy to **Vercel**. Firebase provides Auth,
Firestore, Realtime Database, FCM. Cloudinary stores media. **No Cloud
Functions** (free Spark plan) — server logic runs as Next.js Route Handlers
using the Firebase Admin SDK.

## 0. Prerequisites
- Firebase project `vff-tournament` with Firestore, Realtime Database, Auth
  (Google provider enabled), Cloud Messaging.
- Cloudinary account with an **unsigned** upload preset.
- A Vercel account linked to the GitHub repo.

## 1. Configure environment variables
Follow **ENV_SETUP.md**. Add every required key to Vercel (Production + Preview).
Set `NEXT_PUBLIC_SITE_URL` to your production URL so OG/canonical links resolve.

## 2. Deploy Firestore & RTDB rules / indexes (CLI)
The app's data security depends on these — deploy them BEFORE going live.
```bash
npx -y firebase-tools@latest login          # as vijaypardhu17
npx -y firebase-tools@latest use vff-tournament
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,database
```
- `firestore.rules` — admin-gated writes, server-only auction/bids, PII isolation.
- `firestore.indexes.json` — composite indexes (news/sponsors/marquee queries).
- `database.rules.json` — RTDB: public-read/server-write for auction/matchState;
  owner-only notifications/presence.

> If a public list page shows an error about a missing index, open the link in
> the console error to auto-create it, or add it to `firestore.indexes.json`.

## 3. Bootstrap the first admin
Roles can't be self-escalated (rules). Make yourself admin once, manually:
1. Sign in with Google so your `users/{uid}` doc exists.
2. Firebase Console → Firestore → `users/{yourUid}` → set `role: "admin"`.
3. Re-load the app — `/admin` is now accessible.

## 4. Deploy to Vercel
- Push to the default branch (or `vercel --prod`).
- Build command: `next build` (default). Output is verified at **80/80 pages**.
- After deploy, confirm `/`, `/teams`, `/players`, `/leaderboard`, `/manifest.webmanifest`, `/opengraph-image` all load.

## 5. FCM web push
- Ensure `public/firebase-messaging-sw.js` is served at the site root (it is).
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` must be set.
- Users opt in via the "Enable Notifications" prompt; tokens are stored on
  `users/{uid}.fcmTokens` and used by the server for targeted + broadcast push.

## 6. Lineup reminders (30-min-before) — scheduler
Vercel Hobby cron only fires ~daily, so wire an external scheduler for real
30-minute granularity:
- Point a free cron (e.g. cron-job.org) at
  `POST https://<your-domain>/api/cron/lineup-reminders` every ~10 min
  with header `Authorization: Bearer <CRON_SECRET>`.
- Without it: the lineup window still auto-locks at kickoff, and admins can press
  **"Notify Lineup"** on any match manually.

## 7. Post-deploy smoke test
Run the **PRODUCTION_CHECKLIST.md** end-to-end flow on a real phone before
opening registration.

## Rollback
- Vercel: promote the previous deployment from the Deployments tab.
- Rules: `firebase deploy --only firestore:rules` from a known-good commit.
- Data: restore from the latest export (see **BACKUP_GUIDE.md**).
