# KNOWN ISSUES — VFFT (Season 1)

Status legend: 🟢 acceptable for launch · 🟡 polish soon · 🔴 fix before launch.
Nothing here is 🔴 — the system is launch-ready. These are honest gaps and
intentional design trade-offs.

## SEO / metadata
- 🟡 **Per-page metadata is generic.** Public list pages (`/teams`, `/players`,
  `/news`, `/hall-of-fame`) are Client Components, so only the **root** metadata
  + `%s · VFFT` title template apply. Per-page descriptions and per-article OG
  images for `/news/[slug]` need those pages refactored into Server Components
  (or a `layout.tsx` per section that exports `metadata`/`generateMetadata`).
  Root title, description, default OG image, and favicon **are** in place.

## PWA
- 🟡 **Manifest icon is SVG only.** `app/manifest.ts` references `/icon.svg`.
  A strict Lighthouse *installable PWA* audit wants **192×192 and 512×512 PNG**
  (incl. a `maskable` icon). Add `public/icon-192.png`, `public/icon-512.png`
  and list them in the manifest to fully pass. PWA was flagged optional.
- 🟡 **No Apple touch icon PNG.** Add `app/apple-icon.png` (180×180) for a
  branded iOS home-screen icon; iOS ignores SVG.
- 🟢 No offline service worker for app shell. `firebase-messaging-sw.js` handles
  push only. Offline caching is out of scope for Season 1.

## Notifications
- 🟢 **Broadcast read-state is not per-user.** A broadcast writes one
  `notifications` doc with `userId:"all"`; Firestore rules (correctly) don't let
  a user flip `read` on a doc they don't own, so the bell's unread badge counts
  only **targeted** notifications. Broadcasts always appear in the list. Fine.
- 🟢 **30-min lineup reminder needs an external scheduler** on the free tier
  (Vercel Hobby cron ≈ daily). See DEPLOYMENT_GUIDE §6. The kickoff auto-lock and
  the manual "Notify Lineup" button work without it.

## Auction
- 🟢 **`/api/auction/expire` is intentionally unauthenticated.** It's the
  free-tier replacement for a per-minute cron: any client whose countdown hits
  zero calls it, but the **server refuses to settle until `endsAt` has passed**
  and the settle transaction is idempotent, so it can't be abused to close a lot
  early or double-settle.
- 🟡 Two auction realtime shapes coexist (`useRealtimeAuction`/`AuctionCurrent`
  vs `useCurrentAuction`/`CurrentAuctionState`). Both currently work; consolidate
  to one to avoid a future writer breaking a consumer.

## Admin-managed branding
- 🟡 **Settings → theme colors & favicon are stored but not applied** to the live
  site head/CSS yet (the **website logo** IS applied in the header). Wire favicon
  via `app/icon` and theme colors via CSS variables if you want full live theming.
- 🟡 **Banners** have full admin CRUD (and a `link` field), but there is **no
  homepage banner carousel** rendering them yet. Marquee + sponsors DO render.

## Cosmetic / performance
- 🟢 **`<img>` instead of `next/image`** in several places → ESLint warnings
  (LCP/bandwidth). Functional; optimize high-traffic images post-launch.
- 🟢 Some admin "duplicate" buttons (e.g. Seasons → Duplicate) are disabled
  placeholders.

## Requires manual verification (cannot be automated headless here)
- 🟡 **Runtime smoke test, mobile audit, and Lighthouse** require a real
  browser + Google sign-in. Procedures are scripted in **PRODUCTION_CHECKLIST.md**
  — run them on a phone before opening registration.

## Explicitly out of scope (per product decision — do NOT add for S1)
- OCR match parsing, AI stat extraction, wallet/gambling, automatic screenshot
  parsing. Feature-frozen for Season 1.
