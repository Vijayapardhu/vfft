# ENV SETUP — VFFT

Copy `.env.example` → `.env.local` (gitignored). On Vercel, add the same keys
under **Project → Settings → Environment Variables** (Production + Preview).

> ⚠️ Important: the variable names below are the **actual** ones the code reads.
> An earlier checklist mentioned `FCM_PRIVATE_KEY` / `FCM_CLIENT_EMAIL` and a
> bare `CLOUDINARY_CLOUD_NAME` — those are **NOT used**. FCM is sent through the
> Firebase Admin SDK (the service account), and Cloudinary uses the public cloud
> name + an unsigned upload preset on the client.

## Client (safe to expose — `NEXT_PUBLIC_*`)
These are compiled into the browser bundle by design (Firebase web config and
the Cloudinary cloud name / unsigned preset are public).

| Variable | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `src/firebase/config.ts` | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | config | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | config | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | config | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | config | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | config | ✅ |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | config | optional (analytics) |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | RTDB (auction/live/notifications) | ✅ |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `src/firebase/messaging.ts` (web push) | ✅ for FCM |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | App Check | optional |
| `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION` | functions client (default us-central1) | optional |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `src/services/cloudinaryService.ts` | ✅ for uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | cloudinaryService (must be **unsigned**) | ✅ for uploads |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | local dev only (`true`/`false`) | optional |
| `NEXT_PUBLIC_SITE_URL` | OG/canonical metadata base (`src/app/layout.tsx`) | recommended (prod URL) |

## Server-only (NEVER expose — no `NEXT_PUBLIC_` prefix)
Only read in `src/server/**`, `src/app/api/**`, and `src/scripts/**`. Verified:
**no server secret is imported into any client component.** `firebaseAdmin.ts`
carries `import "server-only"` so a stray client import fails the build.

| Variable | Used by | Required |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_B64` | `src/server/firebaseAdmin.ts` — powers ALL server-authoritative ops (auction, purse, results, transfers, FCM push, notifications) | ✅ **critical** |
| `CRON_SECRET` | `src/app/api/cron/lineup-reminders/route.ts` — protects the cron endpoint | recommended |

### Declared in `.env.example` but currently UNUSED (safe to omit)
- `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — only needed if you switch to
  **signed** server-side uploads. The app uses unsigned client uploads today.

## How to generate `FIREBASE_SERVICE_ACCOUNT_B64`
1. Firebase Console → Project Settings → **Service accounts** → *Generate new private key* → downloads `sa.json`.
2. Base64-encode it (single line):
   - macOS/Linux: `base64 -w0 sa.json` (use `base64 sa.json | tr -d '\n'` on macOS)
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("sa.json"))`
3. Paste the result as the value. **Never commit `sa.json`.**

## Active project
- Firebase project: **`vff-tournament`** (`#825006049882`).
- Firebase CLI auth: `vijaypardhu17` (see `.firebaserc`).

## Quick verification
```bash
npm run typecheck   # tsc --noEmit  → 0 errors
npm run lint        # next lint     → warnings only
npm run build       # next build    → 0 errors, 80/80 pages
```
At runtime, the app degrades gracefully if Firebase/Cloudinary aren't configured
(`isFirebaseConfigured` / `isCloudinaryConfigured` guards), but registration
**requires** Cloudinary (selfie upload).
