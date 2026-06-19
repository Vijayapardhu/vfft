The next document after the updated \*\*SRS\*\*, \*\*PRD\*\*, and \*\*TRD\*\* should be the \*\*AI Development Blueprint (ADB)\*\* because this is the document that AI coding agents (Claude Code, Cursor, Gemini, Copilot, Windsurf, Lovable, etc.) will follow during development.



\---



\# AI DEVELOPMENT BLUEPRINT (ADB)



\# VFFT – Velangi Free Fire Tournament



\*\*Version:\*\* 2.0

\*\*Status:\*\* Production Architecture

\*\*Frontend:\*\* Next.js 15

\*\*Backend:\*\* Firebase + Cloud Functions

\*\*Storage:\*\* Cloudinary



\---



\# 1. Purpose



This document serves as the master instruction set for AI coding agents.



All generated code must comply with:



\* SRS

\* PRD

\* TRD

\* PBRA



If conflicts exist:



```text

PBRA

↓

TRD

↓

SRS

↓

PRD

```



takes precedence.



\---



\# 2. Technology Stack



\## Frontend



\* Next.js 15 App Router

\* TypeScript

\* Tailwind CSS v4

\* Shadcn UI

\* Framer Motion

\* React Hook Form

\* Zod

\* Zustand

\* Recharts

\* Lucide React



\---



\## Backend



Firebase



Services:



\* Authentication

\* Firestore

\* Cloud Functions

\* Cloud Messaging



\---



\## Storage



Cloudinary



\---



\## Hosting



Vercel



\---



\# 3. Coding Rules



Always:



✅ TypeScript



✅ App Router



✅ Server Components whenever possible



✅ Client Components only when necessary



✅ Tailwind



✅ Reusable components



✅ Mobile-first



✅ Strong typing



\---



Never:



❌ Redux



❌ CSS Modules



❌ Inline styles



❌ Material UI



❌ Chakra UI



❌ jQuery



❌ Any UI library besides Shadcn



\---



\# 4. Folder Structure



```text

src



app



components



ui



cards



charts



navigation



auction



dashboard



match



team



player



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



lib



utils



providers



contexts

```



\---



\# 5. Naming Convention



Components



```tsx

PlayerCard.tsx



MatchCard.tsx



TeamBanner.tsx



AuctionPanel.tsx

```



Hooks



```tsx

useAuth.ts



usePlayer.ts



useAuction.ts

```



Stores



```tsx

authStore.ts



teamStore.ts



matchStore.ts

```



Types



```tsx

Player.ts



Team.ts



Match.ts



Auction.ts

```



\---



\# 6. State Management



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



\# 7. Service Layer



```text

authService



playerService



teamService



auctionService



matchService



lineupService



statsService



resultService



seasonService



disputeService



notificationService



transferService

```



\---



\# 8. Firestore Collections



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



\# 9. Cloudinary Structure



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



\# 10. UI Philosophy



Inspired By:



\* IPL

\* Cricbuzz

\* Valorant

\* FIFA Ultimate Team

\* Neo-Brutalism



\---



\# 11. Design Style



\### Thick Borders



```css

border-4 border-black

```



\---



\### Hard Shadows



```css

shadow-\[8px\_8px\_0px\_0px\_#000]

```



\---



\### Rounded Corners



```css

rounded-3xl

```



\---



\### Buttons



Push effect



\---



\### Cards



Lift effect



\---



\### Stickers



Rotate ±2°



\---



\# 12. Colors



Cream



```css

\#FFFDF5

```



Red



```css

\#FF6B6B

```



Yellow



```css

\#FFD93D

```



Purple



```css

\#C4B5FD

```



Black



```css

\#000000

```



Green



```css

\#4ADE80

```



\---



\# 13. Typography



Font:



Space Grotesk



Weights:



700



900



Headings:



Uppercase



\---



\# 14. Animations



Library:



Framer Motion



\---



Cards:



Lift



\---



Buttons:



Push



\---



Badges:



Bounce



\---



Live Indicators:



Pulse



\---



Page Transition:



200ms



\---



Respect:



```css

prefers-reduced-motion

```



\---



\# 15. Authentication



Provider:



Google Sign-In



Never implement:



\* OTP

\* Email Password

\* Username Password



\---



\# 16. Server Authority



Clients may request.



Servers decide.



\---



Never trust clients.



Critical operations must go through Cloud Functions:



\* Auction

\* Purse deduction

\* Transfers

\* Results

\* Leaderboards

\* Achievements



\---



\# 17. Responsive Rules



Mobile-first.



Breakpoints:



```css

sm 640px



md 768px



lg 1024px



xl 1280px



2xl 1536px

```



\---



Mobile:



Cards



Bottom Navigation



Large Buttons



\---



Desktop:



Tables



Sidebar



Multi-column Layout



\---



\# 18. Performance Rules



Always:



\* Server Components

\* Dynamic Imports

\* Lazy Loading

\* Memoization

\* Pagination

\* Skeleton Loading

\* Next Image



\---



\# 19. Error Handling



Never show blank screens.



Always provide:



\* Skeletons

\* Empty states

\* Error cards

\* Retry buttons



\---



\# 20. Accessibility



Minimum touch target:



44px



High contrast



Keyboard support



Reduced motion support



\---



\# 21. Testing



Unit:



Vitest



Integration:



Firebase Emulator



E2E:



Playwright



\---



\# 22. AI Agent Restrictions



AI agents may never:



❌ Modify Firestore rules automatically



❌ Delete collections



❌ Delete audit logs



❌ Bypass Cloud Functions



❌ Write purse values directly



❌ Write leaderboard values directly



❌ Trust client-side calculations



\---



\# 23. Development Order



\### Phase 1



\* Authentication

\* Layout

\* Navbar

\* Sidebar

\* Bottom Navigation



\---



\### Phase 2



\* Player Module

\* Team Module

\* Dashboard



\---



\### Phase 3



\* Matches

\* Results

\* Standings



\---



\### Phase 4



\* Auction System

\* Bid Engine

\* Purse System



\---



\### Phase 5



\* Admin Panel

\* Disputes

\* Hall Of Fame



\---



\### Phase 6



\* Animations

\* Charts

\* Achievements

\* Transfers



\---



\# Core Principles



\### Everything visible can be faked. Everything important must be verified.



\### Clients request. Servers decide.



\### Simplicity over complexity.



\### Mobile-first always.



\### Reusable components over duplicated code.



\---



\# Project



\# VFFT



\## Velangi Free Fire Tournament



\### Tagline



> \*\*Where Village Legends Rise\*\*



\---



After this, the next document to update would be the \*\*UI/UX Documentation v2.0\*\*, which will become the largest document because it will define every route, page, component, layout, animations, and responsive behavior for the entire platform.



