# Turso (LibSQL) + FCM-only Firebase

## Database

Runtime data (catalog, orders, admin users, device tokens, settings) lives in **Turso LibSQL** via **Prisma**.

| Env | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso libsql URL (`libsql://your-db.aws-ap-south-1.turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso database auth token |
| `DATABASE_URL` | Same libsql URL (used by Prisma CLI) |

Supabase / Postgres env vars are **no longer used**.

### First bring-up

1. Set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (local `.env` and Vercel).
2. Deploy — `scripts/vercel-build.mjs` runs `prisma generate` + `prisma db push` (schema only; **no seed**).
3. One-time seed against the empty DB:

```bash
npm run db:seed
```

Seed is **create-only**: missing categories/products/admin are inserted; existing products are never overwritten or deleted.

### Migrating from Supabase

```bash
SUPABASE_DATABASE_URL="postgresql://..." \
TURSO_DATABASE_URL="libsql://..." \
TURSO_AUTH_TOKEN="..." \
npm run db:migrate-from-supabase
```

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

Rotate any database tokens that were pasted into chat or committed by mistake.
