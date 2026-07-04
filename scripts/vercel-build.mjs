// Vercel build entrypoint.
// Ensures the database schema exists, creates admin if needed, then builds.
import { execSync } from "node:child_process";

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

// The URL the app uses at runtime (see src/lib/prisma.ts): pooled preferred.
const runtimeUrl = firstEnv(
  "DATABASE_URL",
  "skr_POSTGRES_PRISMA_URL",
  "skr_DATABASE_URL",
);

// Prefer an explicit direct/unpooled URL for migrations + seed.
let migrateUrl =
  firstEnv(
    "DIRECT_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "skr_DATABASE_URL_UNPOOLED",
    "skr_POSTGRES_URL_NON_POOLING",
  ) || runtimeUrl;

if (!migrateUrl) {
  console.error("[vercel-build] No database URL env var found.");
  console.error("[vercel-build] DB-related env vars present:");
  const keys = Object.keys(process.env)
    .filter((k) => /DATABASE|POSTGRES|PG|NEON|skr_/i.test(k))
    .sort();
  console.error(keys.length ? keys.join("\n") : "  (none)");
  process.exit(1);
}

// Neon: migrations must use a direct connection (pgbouncer/pooler breaks advisory
// locks, and channel_binding can break the connection). Normalise to a direct URL.
function toDirect(urlStr) {
  try {
    const u = new URL(urlStr);
    u.hostname = u.hostname.replace("-pooler", "");
    u.searchParams.delete("pgbouncer");
    u.searchParams.delete("channel_binding");
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    return u.toString();
  } catch {
    return urlStr;
  }
}

migrateUrl = toDirect(migrateUrl);

const mask = (u) => u.replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");
console.log(`[vercel-build] migrate/seed target: ${mask(migrateUrl)}`);

const migrateEnv = { ...process.env, DATABASE_URL: migrateUrl, DIRECT_URL: migrateUrl };

function run(cmd, env = process.env) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("npx prisma generate");
// `db push` (not `migrate deploy`) syncs the schema to whatever state the DB is
// in — it creates our app tables even when the DB already has unrelated tables
// (e.g. Neon Auth) and no Prisma migration history. Additive + idempotent.
run("npx prisma db push --skip-generate --accept-data-loss", migrateEnv);

// One-time: set WIPE_CATALOG=true in Vercel env, redeploy, then remove the variable.
if (process.env.WIPE_CATALOG === "true") {
  console.log("[vercel-build] WIPE_CATALOG=true — clearing product catalog");
  run("npx tsx prisma/clear-catalog.ts", migrateEnv);
}

run("npx prisma db seed", migrateEnv);
run("npx next build");
