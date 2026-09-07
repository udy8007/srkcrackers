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

const POSTGRES_URL_RE = /^postgres(?:ql)?:\/\/.+/i;

function normalizePostgresUrl(urlStr) {
  const s = String(urlStr).trim();
  return s.startsWith("postgres://") ? s.replace(/^postgres:\/\//, "postgresql://") : s;
}

function postgresPort(urlStr) {
  try {
    return new URL(normalizePostgresUrl(urlStr)).port || "5432";
  } catch {
    return null;
  }
}

/** Find any env var whose value looks like a Postgres connection string. */
function discoverPostgresUrlsFromEnv() {
  const found = [];
  for (const [name, raw] of Object.entries(process.env)) {
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (!POSTGRES_URL_RE.test(value)) continue;
    found.push({ name, value: normalizePostgresUrl(value), port: postgresPort(value) });
  }
  return found;
}

function firstEnv(...names) {
  for (const name of names) {
    const { state, value } = envStatus(name);
    if (state === "set") return { value, source: name };
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
    const discovered = discoverPostgresUrlsFromEnv().find(
      (u) => u.port === "6543" || /pooler|pgbouncer/i.test(u.value),
    );
    if (discovered) return discovered.value;

    const poolHost = String(process.env.srk_POSTGRES_POOLER_HOST || "").trim();
    if (!poolHost) return null;
    const params = new URLSearchParams({ sslmode: "require", pgbouncer: "true" });
    return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(password)}@${poolHost}:6543/${database}?${params}`;
  }

  const params = new URLSearchParams({ sslmode: "require" });
  return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(password)}@${host}:5432/${database}?${params}`;
}

function resolveDbUrls() {
  const discovered = discoverPostgresUrlsFromEnv();

  let runtimeHit = firstEnv(...RUNTIME_ENV_NAMES);
  if (!runtimeHit) {
    const pooled = discovered.find(
      (u) => u.port === "6543" || /pooler|pgbouncer/i.test(u.value),
    );
    const any = discovered[0];
    const builtPooled = buildFromSrkParts({ pooled: true });
    const builtDirect = buildFromSrkParts();
    const value = pooled?.value ?? builtPooled ?? any?.value ?? builtDirect;
    const source =
      pooled?.name ?? (builtPooled ? "srk_POSTGRES_* (built pooled)" : any?.name ?? (builtDirect ? "srk_POSTGRES_* (built direct)" : null));
    if (value) runtimeHit = { value, source };
  }

  let migrateHit = firstEnv(...DIRECT_ENV_NAMES);
  if (!migrateHit) {
    const direct = discovered.find((u) => /NON_POOLING|UNPOOLED|DIRECT/i.test(u.name));
    const port5432 = discovered.find((u) => u.port === "5432");
    const builtDirect = buildFromSrkParts();
    const value = direct?.value ?? builtDirect ?? port5432?.value ?? runtimeHit?.value;
    const source =
      direct?.name ??
      (builtDirect ? "srk_POSTGRES_* (built direct)" : port5432?.name ?? runtimeHit?.source);
    if (value) migrateHit = { value, source };
  }

  return {
    runtimeUrl: runtimeHit?.value ?? null,
    migrateUrl: migrateHit?.value ?? null,
    runtimeSource: runtimeHit?.source ?? null,
    migrateSource: migrateHit?.source ?? null,
  };
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

  const discovered = discoverPostgresUrlsFromEnv();
  if (discovered.length) {
    console.error("[vercel-build] Postgres URL-like values found in:");
    for (const { name } of discovered) console.error(`  - ${name}`);
  }

  console.error("");
  console.error("[vercel-build] Fix on the new Vercel project:");
  console.error("  1. Vercel → Project → Settings → Environment Variables");
  console.error("  2. DELETE empty DATABASE_URL and DIRECT_URL placeholders");
  console.error("  3. Add these with real Supabase values (Production + Preview):");
  console.error("       srk_POSTGRES_PRISMA_URL");
  console.error("       srk_POSTGRES_URL_NON_POOLING");
  console.error("     Or set DATABASE_URL + DIRECT_URL to the same connection strings.");
  console.error("  4. Save, then Deployments → Redeploy (env changes need a new deploy).");
}

/** Runtime / pooler URL (Prisma + app). */
const { runtimeUrl, migrateUrl: rawMigrateUrl, runtimeSource, migrateSource } = resolveDbUrls();
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
console.log(`[vercel-build] DATABASE_URL (runtime): ${mask(poolUrl)}${runtimeSource ? `  ← ${runtimeSource}` : ""}`);
console.log(`[vercel-build] DIRECT_URL (schema):   ${mask(migrateUrl)}${migrateSource ? `  ← ${migrateSource}` : ""}`);

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
