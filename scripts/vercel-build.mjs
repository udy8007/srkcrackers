// Vercel build — Supabase Postgres via Prisma (schema sync only; never seed on deploy).
import { execSync } from "node:child_process";

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value).trim();
  }
  return null;
}

/** Runtime / pooler URL (Prisma + app). */
const runtimeUrl = firstEnv(
  "DATABASE_URL",
  "srk_POSTGRES_PRISMA_URL",
  "srk_POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
);

/** Direct (non-pooling) URL for prisma db push. */
let migrateUrl =
  firstEnv(
    "DIRECT_URL",
    "srk_POSTGRES_URL_NON_POOLING",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL_UNPOOLED",
  ) || runtimeUrl;

if (!migrateUrl) {
  console.error("[vercel-build] No database URL env var found.");
  console.error("[vercel-build] DB-related env vars present:");
  const keys = Object.keys(process.env)
    .filter((k) => /DATABASE|POSTGRES|PG|SUPABASE|srk_/i.test(k))
    .sort();
  console.error(keys.length ? keys.join("\n") : "  (none)");
  process.exit(1);
}

/** Prefer a direct host for schema sync (pooler / pgbouncer breaks advisory locks). */
function toDirect(urlStr) {
  try {
    const u = new URL(urlStr);
    u.hostname = u.hostname.replace("-pooler", "");
    u.searchParams.delete("pgbouncer");
    u.searchParams.delete("channel_binding");
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    // Supabase pooler uses 6543; direct is typically 5432
    if (u.port === "6543") u.port = "5432";
    return u.toString();
  } catch {
    return urlStr;
  }
}

migrateUrl = toDirect(migrateUrl);

const poolUrl = runtimeUrl || migrateUrl;

const mask = (u) => u.replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");
console.log(`[vercel-build] DATABASE_URL (runtime): ${mask(poolUrl)}`);
console.log(`[vercel-build] DIRECT_URL (schema):   ${mask(migrateUrl)}`);

const migrateEnv = {
  ...process.env,
  DATABASE_URL: poolUrl,
  DIRECT_URL: migrateUrl,
};

function run(cmd, env = process.env) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("npx prisma generate", migrateEnv);
// Additive schema sync only. No seed — catalog/admin edits must survive deploys.
run("npx prisma db push --skip-generate", migrateEnv);
run("npx next build", migrateEnv);
