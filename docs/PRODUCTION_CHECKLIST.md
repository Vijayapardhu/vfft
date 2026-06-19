# PRODUCTION CHECKLIST — VFFT Season 1

Run this top-to-bottom before opening registration. Boxes that are **[code ✓]**
were verified by static review / build in this hardening pass. Boxes that are
**[manual]** need a human + real device (authenticated Google sign-in can't be
automated headless).

---

## A. Build audit  [code ✓]
```bash
npm run typecheck   # 0 errors ✓
npm run lint        # warnings only (no errors) ✓
npm run build       # 0 errors, 80/80 pages ✓
```

## B. Permissions matrix  [code ✓ — re-test [manual] after deploy]
Enforced at TWO layers: UI route guards **and** server/rules. Verified in code:

| Role | Can | Cannot | Enforced by |
|---|---|---|---|
| **Visitor** | view public pages | everything else | rules public-read |
| **Player** | register, view profile/stats | `/admin/*`, edit results, approve players, bid | `AdminLayout` redirect + rules |
| **Team Leader** | submit lineup, request sub, raise dispute, **bid** | **edit results**, **approve players**, modify auction (start/hammer/finalize) | route role checks + `requireAdmin` + rules |
| **Franchise Owner** | view franchise, submit lineup, **bid** | **modify auction** (admin-only), edit results | `requireAdmin` on auction routes |
| **Admin** | everything | (can't self-demote / remove last admin — guarded) | `requireAdmin`, users-page guard |

- [manual] Sign in as a non-admin → visiting `/admin` redirects to `/`.
- [manual] Team leader cannot reach Results entry; API returns 403 if forced.

## C. Firestore / RTDB rules audit  [code ✓]
Confirmed by reviewing `firestore.rules` + `database.rules.json`:
- [✓] Client writes **denied** for: `results`, `auctions` (write:false),
  `bids` (write:false), `cachedTeamStandings`, `cachedPlayerStandings`,
  `teamSeasonStats`, `playerSeasonStats`, `transfers`, `substitutions`,
  team **purse** (`teams` admin-only), `achievements`, `auditLogs` (immutable).
- [✓] `players`: owner may update only whitelisted profile fields (NOT
  `teamId`/`status`/`soldPrice`); admin may write. Role escalation impossible.
- [✓] PII isolated: `players/{id}/private/contact` + `matches/{id}/private/credentials` owner/participant/admin only.
- [✓] RTDB: `auction`/`matchState`/`leaderboards` server-write-only; `notifications/$uid` owner-read/server-write; `presence/$uid` owner-write.
- [manual] After deploying rules, try a forbidden write from the browser console
  (e.g. `setDoc(doc(db,'results','x'),{})` as a player) → **permission-denied**.

## D. Environment & secrets  [code ✓]
- [✓] No server secret imported into any client component (`server-only` guard).
- [✓] Only public `NEXT_PUBLIC_*` Firebase/Cloudinary values reach the browser.
- [ ] All required vars set on Vercel (see **ENV_SETUP.md**) incl. `NEXT_PUBLIC_SITE_URL`, `FIREBASE_SERVICE_ACCOUNT_B64`, `CRON_SECRET`.

## E. Runtime smoke test (the full tournament chain)  [manual]
Do this on the deployed URL, ideally on a phone. Each step should reflect on the
public side immediately.

1. **Registration** → sign in with Google → take a **live selfie** (gallery
   blocked) → submit. Profile shows status **pending**.
2. **Player Approval** → as admin, `/admin/players` → Approve. Player flips to
   approved; owning user's role links.
3. **Team Creation** → `/admin/teams` → create a team (needs an **active season**
   first via `/admin/seasons`). Assign owner/leader; purse = 10000.
4. **Auction** → `/admin/auction` (or the auction room) → start a lot → bid as a
   team leader → hammer/finalize. ✓ purse deducts, player joins squad.
5. **Lineup Submission** → leader at `/team/lineup` picks **N per side** (matches
   the match's room size) → submits; locks at kickoff.
6. **Match Live** → `/admin/matches` → Go Live. ✓ all users get a "LIVE" push +
   bell entry; match center updates.
7. **Results Entry** → `/admin/results` → pick the match (confirmed lineup
   pre-loads) → enter kills/damage/placement + evidence → Save. ✓ "Results
   published" push fires.
8. **Standings Update** → `/leaderboard` → table reorders by **wins → points →
   kills → NDR**. Re-saving the same result does **not** double-count.
9. **Notifications** → bell shows results/live items; FCM push received (if
   enabled).
10. **Dispute Creation** → leader raises a dispute on the match → `/admin/disputes`
    → respond/resolve/close (resolved-by records the admin uid; closed can't
    be re-opened via Respond).
11. **Hall of Fame** → `/admin/hall-of-fame` → add season honours → `/hall-of-fame`
    renders them.

## F. Data integrity spot-checks  [code ✓ — confirm with real data [manual]]
- [✓] Results → standings (live compute, deterministic `${matchId}_${teamId}`, no dupes).
- [✓] Results → player stats (deterministic `${matchId}_${playerId}`, no dupes).
- [✓] Auction → purse deduction + squad add (single atomic transaction + audit log).
- [✓] Transfers → squad/purse (atomic transaction, ≤2/season, playoff lock).
- [✓] Substitutions → lineup swap applied (server transaction; captain/vice follow).
- [manual] After a real match, verify standings math by hand once.

## G. Mobile audit  [manual]
Test at **360 / 390 / 412 / 768 px** (Chrome DevTools device toolbar + a real phone):
- [ ] No horizontal overflow on any page (admin tables are wrapped in
  `overflow-x-auto` — confirm they scroll, not break layout).
- [ ] Cards/dialogs (`PlayerDetailDialog`, notification bell, forms) fit and scroll.
- [ ] Bottom navigation doesn't overlap content or the FAB.
- [ ] On-screen keyboard doesn't cover the active input (registration, results).
- [ ] Selfie camera opens the **front** camera; capture + retake work.

## H. Admin-on-phone audit  [manual]
Run the whole tournament from a phone only:
- [ ] Create match · Approve player · Start auction · Publish results · Send
  notification · Upload poster — all usable one-handed.

## I. Notification audit  [manual]
- [ ] **Match Live** broadcast → bell + FCM on a second device.
- [ ] **Result Published** broadcast → bell + FCM.
- [ ] **Manual** (`/admin/notifications`) broadcast → reaches all; targeted (if used) reaches one.

## J. SEO audit  [code ✓ root / [manual] verify]
- [✓] Title (`%s · VFFT` template), description, keywords, favicon (`/icon.svg`),
  OG/Twitter card + dynamic OG image (`/opengraph-image`), `metadataBase`.
- [ ] Paste the prod URL into a link-preview tester → image + title render.
- [ ] Per-page descriptions for teams/players/news/HoF → see KNOWN_ISSUES (polish).

## K. Performance audit (Lighthouse, mobile)  [manual]
Targets: **Perf 90+ · A11y 90+ · Best Practices 95+ · SEO 95+**.
- [ ] Run Lighthouse on `/`, `/teams`, `/leaderboard`.
- Likely wins if below target: convert hot `<img>` to `next/image`; add PNG PWA icons.

## L. Backups in place  [manual]
- [ ] Firestore export taken · Cloudinary evidence copied · env/SA in vault ·
  `git tag season-1-launch`. See **BACKUP_GUIDE.md**.

---

## GO / NO-GO
**GO** when A–D are green, E (smoke test) passes end-to-end on the deployed URL,
and L (backups) is done. G/H/I/J/K are strongly recommended but non-blocking;
log any failures in KNOWN_ISSUES.md.
