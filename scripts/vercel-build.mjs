# Vercel build — MySQL via Prisma (schema sync only; never seed on deploy).
import { execSync } from "node:child_process";

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

const urlHit = firstEnv("DATABASE_URL", "srk_DATABASE_URL");
if (!urlHit) {
  console.error("[vercel-build] Set DATABASE_URL to a mysql:// connection string.");
  process.exit(1);
}

const databaseUrl = urlHit.value;
if (!/^mysql(s)?:\/\//i.test(databaseUrl)) {
  console.error("[vercel-build] DATABASE_URL must be a mysql:// URL.");
  process.exit(1);
}

const mask = (u) => u.replace(/:\/\/([^/]+)/, "://****");
console.log(`[vercel-build] DATABASE_URL: ${mask(databaseUrl)}  ← ${urlHit.source}`);

const buildEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
};

function run(cmd, env = buildEnv) {
  console.log(`\n[vercel-build] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env });
}

run("npx prisma generate");
run("npx prisma db push --skip-generate");
run("npx next build");
