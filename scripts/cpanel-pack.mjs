/**
 * Production pack for Hostingial / cPanel "Setup Node.js App".
 *
 * Builds Next.js standalone output, copies static + public assets, and
 * places Passenger app.js next to server.js.
 *
 * Optional zip/upload path. Preferred cPanel deploy is the GitHub clone:
 *   Application root: repositories/srkcrackers
 *   Startup file: server.js
 *
 * This pack still copies standalone output + cpanel/app.js for FTP-only hosts.
 */
import { cpSync, copyFileSync, existsSync } from "node:fs";
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
if (!existsSync(appJs)) {
  console.error("[cpanel-pack] Missing cpanel/app.js");
  process.exit(1);
}
copyFileSync(appJs, join(standalone, "app.js"));

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
copyDep("@prisma/adapter-libsql");
copyDep("@libsql/client");
copyDep("libsql");

console.log("\n[cpanel-pack] Ready: .next/standalone");
console.log("[cpanel-pack] Upload that folder's contents as the Node.js application root.");
console.log("[cpanel-pack] Set Application startup file to: app.js");
console.log("[cpanel-pack] Set env vars in cPanel (do not commit secrets). See .env.example");
