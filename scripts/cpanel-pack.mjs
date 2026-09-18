/**
 * Production pack for Hostingial / cPanel "Setup Node.js App".
 *
 * Produces `.next/standalone` plus static + public assets.
 * Repo-root `server.js` is a wrapper that boots `.next/standalone/server.js`.
 *
 * Upload:
 *   - server.js  (repo root wrapper)
 *   - .next/standalone/  (this pack, entire folder)
 * Do not flatten standalone onto the Git root (that overwrites the wrapper).
 * Do not upload .env / .env.local.
 */
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

function run(cmd) {
  console.log(`\n[cpanel-pack] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env, cwd: root });
}

run("npx prisma generate");
run("npx next build");

const standalone = join(root, ".next", "standalone");
if (!existsSync(standalone)) {
  console.error("[cpanel-pack] Missing .next/standalone — next.config.ts must set output: \"standalone\".");
  process.exit(1);
}

const staticSrc = join(root, ".next", "static");
const staticDest = join(standalone, ".next", "static");
if (!existsSync(staticSrc)) {
  console.error("[cpanel-pack] Missing .next/static after build.");
  process.exit(1);
}
cpSync(staticSrc, staticDest, { recursive: true });

const publicSrc = join(root, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, join(standalone, "public"), { recursive: true });
}

const appJs = join(root, "cpanel", "app.js");
if (existsSync(appJs)) {
  copyFileSync(appJs, join(standalone, "app.js"));
}

for (const name of [".env", ".env.local", ".env.production", ".env.development"]) {
  const leaked = join(standalone, name);
  if (existsSync(leaked)) {
    rmSync(leaked);
    console.log(`[cpanel-pack] removed ${name} from standalone (do not deploy secrets)`);
  }
}

function copyDep(rel) {
  const src = join(root, "node_modules", ...rel.split("/"));
  const dest = join(standalone, "node_modules", ...rel.split("/"));
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`[cpanel-pack] copied node_modules/${rel}`);
  }
}

copyDep(".prisma");
copyDep("@prisma/client");
copyDep("@prisma/engines");
copyDep("@prisma/adapter-libsql");
copyDep("@libsql/client");
copyDep("libsql");
copyDep("next-auth");

function unpackLinuxLibsql(version, dest) {
  const pkgJson = join(dest, "package.json");
  if (existsSync(pkgJson)) {
    console.log(`[cpanel-pack] already have ${dest}`);
    return;
  }

  const tmp = join(root, ".cpanel-pack-tmp");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  execSync(`npm pack @libsql/linux-x64-gnu@${version} --pack-destination "${tmp}"`, {
    cwd: root,
    stdio: "inherit",
  });

  const tgz = readdirSync(tmp).find((name) => name.endsWith(".tgz"));
  if (!tgz) {
    throw new Error(`[cpanel-pack] npm pack did not produce @libsql/linux-x64-gnu@${version}`);
  }

  execSync(`tar -xzf "${join(tmp, tgz)}" -C "${tmp}"`, { cwd: root, stdio: "inherit" });
  mkdirSync(join(dest, ".."), { recursive: true });
  cpSync(join(tmp, "package"), dest, { recursive: true });
  rmSync(tmp, { recursive: true, force: true });
  console.log(`[cpanel-pack] unpacked @libsql/linux-x64-gnu@${version} -> ${dest}`);
}

unpackLinuxLibsql("0.5.29", join(standalone, "node_modules", "@libsql", "linux-x64-gnu"));
unpackLinuxLibsql(
  "0.3.19",
  join(standalone, "node_modules", "@prisma", "adapter-libsql", "node_modules", "@libsql", "linux-x64-gnu"),
);

console.log("\n[cpanel-pack] Ready: .next/standalone");
console.log("[cpanel-pack] cPanel startup file: server.js (repo-root wrapper)");
console.log("[cpanel-pack] Upload repo-root server.js AND the .next/standalone folder (keep that nested path).");
console.log("[cpanel-pack] Set env vars in cPanel. Do not upload .env files.");
