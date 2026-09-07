// Vercel build — Supabase Postgres via Prisma (schema sync only; never seed on deploy).
import { execSync } from "node:child_process";

const RUNTIME_ENV_NAMES = [
  "DATABASE_URL",
  "srk_POSTGRES_PRISMA_URL",
  "srk_POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
];

const DIRECT_ENV_NAMES = [
  "DIRECT_URL",
  "srk_POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
];

function envStatus(name) {
  const raw = process.env[name];
  if (raw === undefined) return { name, state: "missing" };
  const value = String(raw).trim();
  if (!value) return { name, state: "empty" };
  return { name, state: "set", value };
}

function firstEnv(...names) {
  for (const name of names) {
    const { state, value } = envStatus(name);
    if (state === "set") return value;
  }
  return null;
}

/** Build Supabase Postgres URLs from integration component vars (srk_POSTGRES_HOST, etc.). */
function buildFromSrkParts({ pooled = false } = {}) {
  const host = String(process.env.srk_POSTGRES_HOST || "").trim();
  const user = String(process.env.srk_POSTGRES_USER || "").trim();
  const password = String(process.env.srk_POSTGRES_PASSWORD || "").trim();
  const database = String(process.env.srk_POSTGRES_DATABASE || "postgres").trim();
  if (!host || !user || !password) return null;

  const projectRef = host.replace(/^db\./i, "").replace(/\.supabase\.co$/i, "");
  const dbUser = user.includes(".") ? user : `${user}.${projectRef}`;

  if (pooled) {
    const poolHost = String(process.env.srk_POSTGRES_POOLER_HOST || "").trim();
    if (!poolHost) return null;
    const params = new URLSearchParams({ sslmode: "require", pgbouncer: "true" });
    return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(password)}@${poolHost}:6543/${database}?${params}`;
  }

  const params = new URLSearchParams({ sslmode: "require" });
  return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(password)}@${host}:5432/${database}?${params}`;
}

function resolveDbUrls() {
  const runtimeUrl =
    firstEnv(...RUNTIME_ENV_NAMES) ?? buildFromSrkParts({ pooled: true }) ?? buildFromSrkParts();
  const migrateUrl =
    firstEnv(...DIRECT_ENV_NAMES) ?? buildFromSrkParts() ?? runtimeUrl;
  return { runtimeUrl, migrateUrl };
}

function reportDbEnvProblem() {
  const candidates = [...new Set([...RUNTIME_ENV_NAMES, ...DIRECT_ENV_NAMES])];
  const related = Object.keys(process.env)
    .filter((k) => /DATABASE|POSTGRES|PG|SUPABASE|srk_/i.test(k))
    .sort();

  console.error("[vercel-build] No database URL env var with a value was found.");
  console.error("[vercel-build] Checked (in order):");
  for (const name of candidates) {
    const { state } = envStatus(name);
    const label =
      state === "set" ? "set" : state === "empty" ? "EMPTY — add your Supabase URL" : "not set";
    console.error(`  - ${name}: ${label}`);
  }

  if (related.length) {
    console.error("[vercel-build] Other DB-related env keys on this build:");
    for (const name of related) {
      if (candidates.includes(name)) continue;
      const { state } = envStatus(name);
      console.error(`  - ${name}: ${state === "set" ? "set" : state === "empty" ? "EMPTY" : "not set"}`);
    }
  }

  console.error("");
  console.error("[vercel-build] Fix on the new Vercel project:");
  console.error("  1. Vercel → Project → Settings → Environment Variables");
  console.error("  2. Add Supabase integration vars (minimum for build):");
  console.error("       srk_POSTGRES_PRISMA_URL, srk_POSTGRES_URL_NON_POOLING");
  console.error("     Or set DATABASE_URL + DIRECT_URL manually.");
  console.error("  3. Remove empty DATABASE_URL if you use srk_POSTGRES_* instead.");
  console.error("  4. Enable Production + Preview, then redeploy.");
}

/** Runtime / pooler URL (Prisma + app). */
const { runtimeUrl, migrateUrl: rawMigrateUrl } = resolveDbUrls();
let migrateUrl = rawMigrateUrl;

if (!migrateUrl) {
  reportDbEnvProblem();
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
