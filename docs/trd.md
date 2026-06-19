\# TECHNICAL REQUIREMENTS DOCUMENT (TRD)



\# VFFT – Velangi Free Fire Tournament



\*\*Version:\*\* 2.0

\*\*Status:\*\* Updated

\*\*Architecture:\*\* Server-Authoritative

\*\*Frontend Hosting:\*\* Vercel

\*\*Backend:\*\* Firebase + Cloud Functions

\*\*Storage:\*\* Cloudinary



\---



\# 1. Technical Overview



VFFT is a franchise-based Free Fire esports platform designed around fairness, scalability, and mobile-first usability.



The architecture follows:



\* Server-authoritative operations

\* Event-driven updates

\* Firestore transactions

\* Evidence-based statistics

\* Multi-season isolation



\---



\# 2. Technology Stack



\## Frontend



\* Next.js 15 (App Router)

\* TypeScript

\* Tailwind CSS v4

\* Shadcn UI

\* Framer Motion

\* React Hook Form

\* Zod

\* Zustand

\* Lucide React

\* Recharts



\---



\## Backend



Firebase



Components:



\* Firebase Authentication

\* Cloud Firestore

\* Cloud Functions

\* Firebase Cloud Messaging



\---



\## Storage



Cloudinary



Stores:



\* Player Images

\* Team Logos

\* Team Banners

\* Posters

\* Gallery Images

\* Match Evidence

\* Winner Photos



\---



\## Hosting



Frontend:



Vercel



Backend:



Firebase



\---



\## Testing



\* Vitest

\* Firebase Emulator

\* Playwright



\---



\# 3. System Architecture



```text

Client (Next.js)



↓



Firebase Authentication



↓



Cloud Firestore



↓



Cloud Functions



↓



Cloudinary



↓



Firebase Cloud Messaging

```



\---



\# 4. Deployment Architecture



\## Frontend Pipeline



```text

GitHub



↓



Vercel



↓



Production

```



\---



\## Backend Pipeline



```text

GitHub



↓



GitHub Actions



↓



firebase deploy



functions



firestore rules



firestore indexes

```



\---



\# 5. Authentication



Provider:



Google Sign-In



Library:



Firebase Authentication



No support for:



\* Email Password

\* OTP

\* Username Password



\---



\# 6. User Roles



\## Admin



Full Access



\---



\## Franchise Owner



Read-only franchise access



\---



\## Team Leader



Squad Management



\---



\## Player



Profile and statistics



\---



\## Guest



Public pages



\---



\# 7. Folder Structure



```text

src



app



components



ui



cards



charts



navigation



dashboard



auction



team



player



match



leaderboard



hall-of-fame



news



rules



admin



hooks



services



firebase



store



types



constants



utils



lib



contexts



providers

```



\---



\# 8. Firebase Folder Structure



```text

firebase



config.ts



auth.ts



firestore.ts



functions.ts



messaging.ts



collections.ts

```



\---



\# 9. Firestore Collections



```text

users



players



teams



matches



lineups



results



playerMatchStats



teamSeasonStats



playerSeasonStats



auctions



bids



substitutions



transfers



disputes



auditLogs



notifications



announcements



gallery



hallOfFame



achievements



cachedLeaderboards



cachedPlayerStandings



cachedTeamStandings



seasons



resultEvidence

```



\---



\# 10. Cloudinary Folder Structure



```text

vfft



players



teams



banners



gallery



hall-of-fame



match-evidence



winners



posters

```



\---



\# 11. Route Structure



\## Public Routes



```text

/



/teams



/players



/matches



/leaderboard



/news



/rules



/hall-of-fame



/about

```



\---



\## Auth Route



```text

/login

```



\---



\## Player Routes



```text

/dashboard



/profile



/my-team



/my-matches



/achievements



/notifications

```



\---



\## Team Leader Routes



```text

/team/manage



/team/lineup



/team/history



/team/squad

```



\---



\## Franchise Owner Routes



```text

/franchise



/franchise/players



/franchise/statistics



/franchise/history

```



\---



\## Admin Routes



```text

/admin



/admin/players



/admin/teams



/admin/auction



/admin/matches



/admin/results



/admin/gallery



/admin/seasons



/admin/notifications



/admin/disputes



/admin/hall-of-fame

```



\---



\# 12. State Management



Library:



Zustand



Stores:



```text

authStore



userStore



teamStore



auctionStore



matchStore



seasonStore



notificationStore

```



\---



\# 13. Services Layer



```text

authService



playerService



teamService



auctionService



matchService



lineupService



resultService



statsService



seasonService



notificationService



disputeService



transferService

```



\---



\# 14. Core Flow



```text

Registration



↓



Admin Approval



↓



Auction



↓



Team Formation



↓



Fixture Generation



↓



Lineup Submission



↓



Admin Approval



↓



Match



↓



Result Entry



↓



Player Statistics Entry



↓



Leaderboard Update



↓



Playoffs



↓



Champion

```



\---



\# 15. Auction Architecture



Server-authoritative.



Clients can only:



```typescript

submitBid()

```



\---



Cloud Function validates:



\* Bid amount

\* Auction status

\* Team purse

\* Player status

\* Ownership



\---



Flow:



```text

Bid Request



↓



Cloud Function



↓



Firestore Transaction



↓



Update Highest Bid



↓



Realtime Broadcast



↓



UI Update

```



\---



\# 16. Purse Management



Clients never update:



```typescript

remainingPurse

```



\---



Cloud Functions perform:



\* Purse deduction

\* Refunds

\* Transfers



Using Firestore transactions.



\---



\# 17. Match Result Architecture



Admin enters:



\### Team Results



\* Kills

\* Placement points

\* Total points



\---



\### Player Statistics



\* Kills

\* Damage

\* Headshots

\* MVP



\---



Each entry references:



```typescript

evidenceId

```



\---



No stat exists without evidence.



\---



\# 18. Match Evidence



Collection:



```typescript

resultEvidence

```



Schema:



```typescript

{

evidenceId,

matchId,

screenshotUrl,

uploadedBy,

uploadedAt

}

```



Stored in:



```text

vfft/match-evidence

```



\---



\# 19. Leaderboards



\## Team Standings



Source:



```text

results

```



Cache:



```text

cachedTeamStandings

```



\---



\## Player Standings



Source:



```text

playerMatchStats

```



Cache:



```text

cachedPlayerStandings

```



\---



Updates triggered automatically through Cloud Functions.



No cron jobs.



\---



\# 20. Audit Logs



Collection:



```typescript

auditLogs

```



Schema:



```typescript

{

action,

entityType,

entityId,

performedBy,

timestamp,

beforeState,

afterState

}

```



\---



Allowed diff fields:



\* kills

\* points

\* status

\* soldPrice

\* remainingPurse

\* wins

\* losses

\* mvp



\---



Forbidden:



\* name

\* email

\* phone

\* whatsappNumber

\* photoURL



\---



\# 21. Disputes



Collection:



```typescript

disputes

```



Schema:



```typescript

{

matchId,

raisedBy,

reason,

status,

resolutionNotes,

evidenceId

}

```



Status:



```text

Open



↓



Under Review



↓



Resolved



↓



Closed

```



\---



\# 22. Account Recovery



Level 1:



Same:



\* Free Fire UID

\* WhatsApp Number



\---



Level 2:



Same:



\* Real Name

\* Profile Image



Plus:



Team Leader verification



\---



Level 3:



Requires:



\* Team Leader approval

\* Franchise Owner approval



All actions recorded.



\---



\# 23. Transfer Rules



Maximum:



2 transfers per season



Restrictions:



\* No transfers during playoffs

\* Purse deduction enforced by Cloud Functions



\---



\# 24. Emergency Substitution



Conditions:



\* Before room start

\* Admin approval

\* Player must belong to same team



Does not count toward transfer limit.



\---



\# 25. Performance Optimization



Use:



\* Server Components

\* Dynamic Imports

\* Lazy Loading

\* Pagination

\* Skeleton Loaders

\* Memoization

\* Image Optimization



\---



\# 26. Security



Authentication:



Firebase Auth



\---



Authorization:



Firestore Rules



\---



Critical Operations:



Cloud Functions



\---



Uploads:



Cloudinary Presets



\---



App Protection:



Firebase App Check



\---



reCAPTCHA



\---



\# 27. Responsive Breakpoints



```css

sm 640px



md 768px



lg 1024px



xl 1280px



2xl 1536px

```



\---



\# 28. Accessibility



Supports:



```css

prefers-reduced-motion

```



Disables:



\* Bounce

\* Pulse

\* Rotate

\* Confetti



\---



Minimum touch target:



44px



\---



\# 29. Testing Strategy



\## Unit Tests



Vitest



\---



\## Integration Tests



Firebase Emulator



\---



\## End-to-End Tests



Playwright



\---



\# 30. Backup Strategy



Daily:



Firestore Export



\---



Cloudinary Backup



\---



Versioned:



\* Firestore Rules

\* Indexes

\* Functions



\---



\# 31. Environment Separation



```text

vfft-dev



vfft-staging



vfft-production

```



\---



\# 32. Future Architecture



Planned:



\* OCR Match Scanner

\* AI Statistics Engine

\* Market Value System

\* Fantasy League

\* YouTube Live Integration

\* PWA Support

\* Multi-game Support



\---



\# Project



\# VFFT



\## Velangi Free Fire Tournament



\### Tagline



> \*\*Where Village Legends Rise\*\*



\---



\# Technical Principle



> \*\*Everything visible can be faked. Everything important must be verified.\*\*



\---



\# Architecture Principle



> \*\*Clients request. Servers decide.\*\*



