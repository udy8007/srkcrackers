// Vercel build entrypoint.
// Reads the Neon connection string from process.env (works regardless of the
// build shell), applies migrations + seed to the integration DB, then builds.
import { execSync } from "node:child_process";

function pick(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return { name, value };
  }
  return null;
}

// Prefer an UNPOOLED / direct connection — Neon migrations require it.
const direct = pick(
  "skr_DATABASE_URL_UNPOOLED",
  "skr_POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
  "skr_POSTGRES_PRISMA_URL",
  "skr_DATABASE_URL",
  "DATABASE_URL",
);

if (!direct) {
  console.error("[vercel-build] No database URL env var found.");
  console.error("[vercel-build] Available DB-related env vars:");
  const keys = Object.keys(process.env)
    .filter((k) => /skr_|DATABASE|POSTGRES|PG|NEON/i.test(k))
    .sort();
  console.error(keys.length ? keys.join("\n") : "  (none)");
  process.exit(1);
}

const masked = direct.value.replace(/:\/\/([^:]+):[^@]+@/, "://$1:****@");
console.log(`[vercel-build] Using ${direct.name} for migrate/seed -> ${masked}`);

const env = { ...process.env, DATABASE_URL: direct.value, DIRECT_URL: direct.value };

function run(cmd) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("prisma generate");
run("prisma migrate deploy");
run("prisma db seed");
run("next build");
