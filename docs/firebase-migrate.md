# Firebase migrate (`srk-cracker`)

Runtime data is **Cloud Firestore**. Files (new product uploads + payment screenshots) target **Firebase Storage**. Storefront product photos from the winter-sun seed still use repo static files under `public/products/photos/` until Storage is provisioned and images are re-imported.

## Required env

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_FILE` | Admin SDK (Firestore, Storage, FCM) |
| `FIREBASE_STORAGE_BUCKET` | e.g. `srk-cracker.firebasestorage.app` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded on `npm run db:import-firebase` |

Neon `DATABASE_URL` / `skr_*` are **not** used at runtime. Safe to delete leftover Neon env keys in the Vercel project settings.

## Enable Storage (manual — Blaze required)

New default buckets need the project on the **Blaze** plan:

1. [Firebase Console → Storage](https://console.firebase.google.com/project/srk-cracker/storage) → Get started  
2. Or enable billing on GCP for `srk-cracker`, then:

```bash
npx tsx scripts/ensure-firebase-storage.ts
npx tsx scripts/enable-firebase-apis.ts
npm run db:import-firebase
```

Deploy rules from `storage.rules` in the console (Products public-read; orders private).

Until Storage exists, catalog images keep working from `/products/photos/...` in this deploy. Admin product image upload and payment screenshot upload will fail with a clear Storage error.

## Seed / re-import

```bash
npm run db:import-firebase
# or
npx tsx scripts/import-backup-to-firebase.ts backups/srk-backup-winter-sun-….json
```

Uses the latest `*winter-sun*.json` under `backups/` by default.

## Data not recovered from Neon morning-star

Quota-locked Neon (`morning-star`) rows (e.g. **Double Ball** and any other SKUs only on that DB) were **not** imported. Re-add them in Admin after go-live if needed.

## Verify

```bash
npx tsx scripts/probe-firebase.ts
npm run dev
# storefront catalog, checkout, admin login/CRUD, FCM test push
```

Production needs `FIREBASE_SERVICE_ACCOUNT_JSON` + `FIREBASE_STORAGE_BUCKET` on Vercel (Production + Preview).
