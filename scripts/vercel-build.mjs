// Vercel build entrypoint.
// Schema sync only — never seed/overwrite catalog on deploy (admin edits must persist).
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

// Prefer an explicit direct/unpooled URL for schema sync.
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

// Neon: schema sync must use a direct connection (pgbouncer/pooler breaks advisory
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
console.log(`[vercel-build] schema sync target: ${mask(migrateUrl)}`);

const migrateEnv = { ...process.env, DATABASE_URL: migrateUrl, DIRECT_URL: migrateUrl };

function run(cmd, env = process.env) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("npx prisma generate");
// Additive schema sync only. No seed, no --accept-data-loss, no catalog wipe.
// Product/category data is managed in Admin and must survive deploys.
run("npx prisma db push --skip-generate", migrateEnv);
run("npx next build");
