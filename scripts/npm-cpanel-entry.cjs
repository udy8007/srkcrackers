"use strict";

/**
 * Loader for npm lifecycle scripts. Resolves scripts/run-at-app-root.cjs
 * without using process.cwd() as the project root (cPanel nodevenv/lib).
 */

const fs = require("node:fs");
const path = require("node:path");

function runnerAt(dir) {
  const file = path.join(dir, "scripts", "run-at-app-root.cjs");
  return fs.existsSync(file) ? file : null;
}

function findRunner() {
  if (process.env.npm_package_json) {
    try {
      const fromPkg = runnerAt(path.dirname(fs.realpathSync(process.env.npm_package_json)));
      if (fromPkg) return fromPkg;
    } catch {
      const fromPkg = runnerAt(path.dirname(process.env.npm_package_json));
      if (fromPkg) return fromPkg;
    }
  }

  const fromThisFile = path.join(__dirname, "run-at-app-root.cjs");
  if (fs.existsSync(fromThisFile)) return fromThisFile;

  const normalized = process.cwd().replace(/\\/g, "/");
  const token = "/nodevenv/";
  const index = normalized.indexOf(token);
  if (index >= 0) {
    const home = normalized.slice(0, index);
    const after = normalized.slice(index + token.length).replace(/\/\d+\/lib(?:\/.*)?$/, "");
    const mapped = runnerAt(path.join(home, after));
    if (mapped) return mapped;
  }

  if (process.env.INIT_CWD) {
    const fromInit = runnerAt(process.env.INIT_CWD);
    if (fromInit) return fromInit;
  }

  return runnerAt(process.cwd());
}

const runner = findRunner();
if (!runner) {
  console.error(
    "[npm-cpanel-entry] Cannot locate scripts/run-at-app-root.cjs. cwd=" + process.cwd(),
  );
  process.exit(1);
}

require(runner);
