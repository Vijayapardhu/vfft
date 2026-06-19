# VFFT — Velangi Free Fire Tournament

> **Where Village Legends Rise.** An IPL-style, franchise-based Free Fire esports platform. Mobile-first, server-authoritative, and built to stay free (Vercel + Firebase + Cloudinary).

Built strictly to the requirement docs in [`docs/`](./docs) — priority order **TRD → SRS → PRD → UID**.

## Tech stack

- **Next.js 15** (App Router) · **TypeScript** (strict) · **Tailwind CSS v4** (CSS-first theme)
- **Firebase** — Authentication (Google only), Cloud Firestore, Cloud Functions, Cloud Messaging
- **Cloudinary** — image storage · **Vercel** — hosting
- Framer Motion · React Hook Form · Zod · Zustand · Recharts · Lucide

## Architecture principles

- **Clients request. Servers decide.** Critical operations (auction, purse, transfers, results, leaderboards, achievements) go through Cloud Functions only — never direct client writes.
- **Everything visible can be faked. Everything important must be verified.** Stats require evidence; sensitive changes are audited.

## Getting started

1. **Install** (already done if `node_modules` exists):
   ```bash
   npm install
   ```
2. **Configure credentials** — copy the template and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
   You need a Firebase project (Web app config + Google Sign-In enabled) and a Cloudinary account (cloud name + an unsigned upload preset). Until these are set, the UI renders fully but **sign-in and data are disabled** (the login page shows a notice).
3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next) |
| `npm test` | Vitest (unit) |
| `npm run test:e2e` | Playwright (E2E) |

## Project structure

```
src/
  app/                 # App Router routes (public, (authed) group, /login)
  components/
    ui/                # Reusable neo-brutalist primitives (button, card, badge…)
    navigation/        # Navbar, BottomNav, AppShell, Logo, AuthButton
    auth/              # AuthGuard
  constants/           # app, colors, roles, routes, navigation
  firebase/            # config, auth, firestore, functions, messaging, collections
  hooks/               # useAuth, …
  providers/           # AuthProvider, Providers
  services/            # authService, … (added per feature)
  store/               # Zustand stores (authStore, … added per feature)
  types/               # Domain models (one file per entity)
docs/                  # SRS, PRD, TRD, ADB, UI/UX (source of truth)
```

## Build phases

- [x] **Setup** — scaffold, design system, foundation (types, constants, Firebase layer)
- [x] **Phase 1** — Google auth, layout, navigation, route protection
- [x] **Phase 2** — Player module (register/list/profile), Team module (list/tabbed profile), personalized Dashboard
- [x] **Phase 3** — Matches (list + detail w/ private room credentials), results display, team + player leaderboards (derived from results). _Fixture generation, result entry & lineup submission land with the admin panel (P5) + Cloud Functions (P4)._
- [x] **Phase 4** — Server-authoritative auction engine: bid/purse/finalize via **Vercel Route Handlers + Firebase Admin SDK** (no Cloud Functions — free Spark plan), live state mirrored to **Realtime Database**, self-closing auction via client-triggered + server-validated expiry. _Needs `FIREBASE_SERVICE_ACCOUNT_B64` to run._
- [ ] **Phase 5** — Admin panel, Hall of Fame, Disputes
- [ ] **Phase 6** — Charts, Animations, Transfers, Achievements
