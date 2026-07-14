# Supabase Postgres + FCM-only Firebase

## Database

Runtime data (catalog, orders, admin users, device tokens, settings) lives in **Supabase Postgres** via **Prisma**.

| Env | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Prisma URL (port `6543`, `pgbouncer=true`) — or `srk_POSTGRES_PRISMA_URL` |
| `DIRECT_URL` | Non-pooling URL (port `5432`) for `prisma db push` — or `srk_POSTGRES_URL_NON_POOLING` |

Supabase anon / service-role keys and `NEXT_PUBLIC_srk_SUPABASE_*` are **not** required for Prisma.

### First bring-up

1. Set `DATABASE_URL` + `DIRECT_URL` (local `.env` and Vercel).
2. Deploy — `scripts/vercel-build.mjs` runs `prisma generate` + `prisma db push` (schema only; **no seed**).
3. One-time seed against the empty DB:

```bash
npm run db:seed
```

Seed is **create-only**: missing categories/products/admin are inserted; existing products are never overwritten or deleted.

## Firebase (FCM only)

Firebase is used only for **admin APK push**. See [admin-apk-fcm.md](./admin-apk-fcm.md).

- Prefer `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel, or upload the service account JSON in Admin → Settings.
- Do **not** use Firestore or Firebase Storage for app data.
- Product/order images are stored as data URLs or local `/products/...` paths.

## Local commands

```bash
npm run db:generate
npm run db:push
npm run db:seed   # fresh DB only / safe re-run
npm run dev
```

Rotate any database passwords that were pasted into chat or committed by mistake.
