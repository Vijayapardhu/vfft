# BACKUP GUIDE — VFFT

Back up before launch, then on a regular cadence during Season 1 (daily during
active match weeks). Three things to protect: **Firestore**, **Cloudinary
media**, and **environment variables / service account**.

## 1. Firestore
### Option A — Console export (simplest)
Firebase Console → Firestore → **Import/Export** → *Export* → choose a Cloud
Storage bucket. Schedule recurring exports if available on the plan.

### Option B — gcloud (scriptable)
```bash
gcloud firestore export gs://<your-backup-bucket>/firestore/$(date +%F) \
  --project=vff-tournament
```
Restore:
```bash
gcloud firestore import gs://<your-backup-bucket>/firestore/<date> \
  --project=vff-tournament
```
> Note: this project's gcloud access may be limited (see memory). If gcloud is
> blocked, use the Console export (Option A) or a manual JSON dump:
> ```bash
> npx -y firebase-tools@latest firestore:databases:list   # verify access
> ```
> Critical collections to verify in any backup: `users, players (+private/contact),
> teams, matches (+private/credentials), lineups, results, resultEvidence,
> playerMatchStats, auctions, bids, transfers, substitutions, disputes,
> seasons, hallOfFame, achievements, auditLogs, notifications, news, sponsors,
> gallery, weapons, homeContent, settings, marquee`.

## 2. Cloudinary media
Folders in use: `vfft/players, teams, banners, gallery, hall-of-fame,
match-evidence, winners, posters`.
- Cloudinary Console → Media Library → select → **Download** (or zip per folder).
- Or use the Admin API:
  ```bash
  # requires CLOUDINARY_API_KEY/SECRET
  curl https://<key>:<secret>@api.cloudinary.com/v1_1/<cloud>/resources/image?max_results=500
  ```
- Cloudinary retains originals; deletions are permanent — keep an offline copy of
  match evidence (it backs every result/stat per TRD §17).

## 3. Environment variables & service account
- Export Vercel env: **Project → Settings → Environment Variables → ⋯ → Download** (or copy each).
- Keep the **service account JSON** (source of `FIREBASE_SERVICE_ACCOUNT_B64`) in
  a password manager / offline vault. Never in git.
- Store the Cloudinary unsigned preset name + cloud name with the env backup.

## 4. Versioned in git (already safe)
- `firestore.rules`, `firestore.indexes.json`, `database.rules.json`,
  `.firebaserc`, `firebase.json`. Tag a release before each season:
  ```bash
  git tag season-1-launch && git push --tags
  ```

## 5. Recommended cadence
| Asset | Before launch | During Season 1 |
|---|---|---|
| Firestore | ✅ full export | daily (match weeks) |
| Cloudinary evidence | ✅ | after each match day |
| Env / SA | ✅ to vault | on any change |
| Rules/indexes (git tag) | ✅ | on any change |
