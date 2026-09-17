"use strict";

/**
 * Run Prisma / Next CLI from the Git application root, even when cPanel
 * CloudLinux executes npm scripts with cwd =
 *   ~/nodevenv/<application-root>/<node-major>/lib
 *
 * Does not hardcode /home/<user>. Application root is derived from:
 *   - this file's location (__dirname)
 *   - npm_package_json (realpath)
 *   - INIT_CWD
 *   - CloudLinux nodevenv path shape
 *   - walking parents for prisma/schema.prisma
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function exists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

function isAppRoot(dir) {
  return exists(path.join(dir, "prisma", "schema.prisma")) && exists(path.join(dir, "package.json"));
}

function mapNodevenvToAppRoot(input) {
  const normalized = String(input || "").replace(/\\/g, "/");
  const token = "/nodevenv/";
  const index = normalized.indexOf(token);
  if (index < 0) return null;

  const home = normalized.slice(0, index);
  const after = normalized.slice(index + token.length).replace(/\/\d+\/lib(?:\/.*)?$/, "");
  if (!after) return null;

  const mapped = path.join(home, after);
  return isAppRoot(mapped) ? mapped : null;
}

function walkUp(start) {
  let dir = path.resolve(start || process.cwd());
  for (let i = 0; i < 12; i++) {
    if (isAppRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function resolveAppRoot() {
  const candidates = [];

  candidates.push(path.join(__dirname, ".."));

  if (process.env.npm_package_json) {
    try {
      candidates.push(path.dirname(fs.realpathSync(process.env.npm_package_json)));
    } catch {
      candidates.push(path.dirname(process.env.npm_package_json));
    }
  }

  if (process.env.INIT_CWD) candidates.push(process.env.INIT_CWD);
  candidates.push(process.cwd());

  for (const candidate of candidates) {
    if (candidate && isAppRoot(candidate)) return path.resolve(candidate);
    const mapped = mapNodevenvToAppRoot(candidate);
    if (mapped) return path.resolve(mapped);
    const walked = walkUp(candidate);
    if (walked) return walked;
  }

  throw new Error(
    `[run-at-app-root] Could not find prisma/schema.prisma (cwd=${process.cwd()}). ` +
      `On cPanel the schema lives in the application root, not nodevenv/.../lib.`,
  );
}

function resolvePackageFile(pkgName, relativeFile, bases) {
  for (const base of bases) {
    try {
      const pkgJson = require.resolve(`${pkgName}/package.json`, { paths: [base] });
      const file = path.join(path.dirname(pkgJson), relativeFile);
      if (exists(file)) return file;
    } catch {
      // try next base
    }
  }
  return null;
}

function runNodeCli(cliFile, args, cwd, extraPathDirs) {
  if (!cliFile) {
    throw new Error(`[run-at-app-root] CLI not found. args=${args.join(" ")}`);
  }

  const env = { ...process.env };
  const bins = extraPathDirs.map((dir) => path.join(dir, "node_modules", ".bin"));
  const joined = bins.concat(env.PATH || env.Path || "").join(path.delimiter);
  env.PATH = joined;
  env.Path = joined;

  console.log(`[run-at-app-root] ${path.basename(cliFile)} ${args.join(" ")}`);
  console.log(`[run-at-app-root] cwd=${cwd}`);

  const result = spawnSync(process.execPath, [cliFile, ...args], {
    cwd,
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveTask() {
  if (process.env.SRK_NPM_TASK) return process.env.SRK_NPM_TASK;
  const arg = process.argv[2];
  if (arg === "generate" || arg === "build") return arg;
  if (process.env.npm_lifecycle_event === "build") return "build";
  return "generate";
}

function main() {
  const appRoot = resolveAppRoot();
  const schema = path.join(appRoot, "prisma", "schema.prisma");
  const searchBases = [process.cwd(), appRoot];
  const task = resolveTask();

  const prismaCli = resolvePackageFile("prisma", "build/index.js", searchBases);
  const nextCli = resolvePackageFile("next", "dist/bin/next", searchBases);

  runNodeCli(prismaCli, ["generate", "--schema", schema], appRoot, searchBases);

  if (task === "build") {
    runNodeCli(nextCli, ["build"], appRoot, searchBases);
  }
}

main();
