// Vercel build — Turso (LibSQL) via Prisma (schema sync only; never seed on deploy).
import { execSync } from "node:child_process";

const TURSO_URL_NAMES = [
  "TURSO_DATABASE_URL",
  "DATABASE_URL",
  "srk_TURSO_DATABASE_URL",
];

const TURSO_TOKEN_NAMES = [
  "TURSO_AUTH_TOKEN",
  "srk_TURSO_AUTH_TOKEN",
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
    if (state === "set") return { value, source: name };
  }
  return null;
}

function resolveTursoEnv() {
  const urlHit = firstEnv(...TURSO_URL_NAMES);
  const tokenHit = firstEnv(...TURSO_TOKEN_NAMES);

  if (!urlHit) {
    console.error("[vercel-build] No Turso database URL found.");
    console.error("[vercel-build] Set one of:");
    for (const name of TURSO_URL_NAMES) console.error(`  - ${name}`);
    console.error("");
    console.error("[vercel-build] Example:");
    console.error('  TURSO_DATABASE_URL="libsql://your-db.aws-ap-south-1.turso.io"');
    console.error('  TURSO_AUTH_TOKEN="your-turso-token"');
    process.exit(1);
  }

  const url = urlHit.value;
  const isTurso =
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.includes(".turso.io");

  if (!isTurso) {
    console.error(`[vercel-build] DATABASE_URL must be a Turso libsql URL, got: ${url.slice(0, 40)}...`);
    process.exit(1);
  }

  return {
    databaseUrl: url,
    authToken: tokenHit?.value ?? "",
    urlSource: urlHit.source,
    tokenSource: tokenHit?.source ?? null,
  };
}

const { databaseUrl, authToken, urlSource, tokenSource } = resolveTursoEnv();

const mask = (u) => u.replace(/:\/\/([^/]+)/, "://****");
console.log(`[vercel-build] TURSO_DATABASE_URL: ${mask(databaseUrl)}  ← ${urlSource}`);
console.log(`[vercel-build] TURSO_AUTH_TOKEN:   ${authToken ? "set" : "missing"}${tokenSource ? `  ← ${tokenSource}` : ""}`);

const buildEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  TURSO_DATABASE_URL: databaseUrl,
  TURSO_AUTH_TOKEN: authToken,
};

function run(cmd, env = buildEnv) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("npx prisma generate");
// Additive schema sync to Turso (Prisma CLI needs file: for sqlite, so we apply DDL via libsql).
run("node scripts/prisma-push-turso.mjs");
run("npx next build");
