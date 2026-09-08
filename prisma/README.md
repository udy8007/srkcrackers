# Prisma schema (Turso LibSQL)

Active data layer for the app. See [docs/supabase.md](../docs/supabase.md).

```bash
npm run db:generate
npm run db:push
npm run db:seed   # create-only — safe on empty DB; never overwrites products
```

`scripts/vercel-build.mjs` runs generate + `db push` on deploy (**no seed**).
