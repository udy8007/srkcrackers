# MySQL + FCM-only Firebase

## Database

Runtime data (catalog, orders, admin users, device tokens, settings) lives in **MySQL** via **Prisma**.

| Env | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL URL (`mysql://USER:PASSWORD@HOST:3306/DATABASE`) |

URL-encode special characters in the password (`&` → `%26`, `!` → `%21`, `]` → `%5D`).

On Hostinger, the Node.js app on the same account often uses `localhost`. From another machine, use the remote hostname and allow your IP in cPanel → **Remote MySQL**.

Turso / LibSQL env vars are **no longer used**.

### First bring-up

1. Set `DATABASE_URL` (local `.env` and cPanel).
2. Deploy — `scripts/vercel-build.mjs` / `npm run db:push` syncs schema only (**no seed**).
3. One-time seed against the empty DB:

```bash
npm run db:seed
```

Seed is **create-only**: missing categories/products/admin are inserted; existing products are never overwritten or deleted.

### Migrating from Turso

```bash
TURSO_DATABASE_URL="libsql://..." \
TURSO_AUTH_TOKEN="..." \
DATABASE_URL="mysql://..." \
npm run db:migrate-from-turso
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
