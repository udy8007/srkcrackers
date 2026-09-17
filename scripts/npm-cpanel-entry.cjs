"use strict";

/**
 * cPanel-safe npm lifecycle entry.
 * CloudLinux symlinks nodevenv/.../lib/package.json -> the real app package.json.
 * Resolve that symlink before locating scripts/.
 */

const fs = require("node:fs");
const path = require("node:path");

const packageJson = process.env.npm_package_json;

if (!packageJson) {
  console.error("[npm-cpanel-entry] npm_package_json is missing");
  process.exit(1);
}

const realPackageJson = fs.realpathSync(packageJson);
const appRoot = path.dirname(realPackageJson);

const helper = path.join(appRoot, "scripts", "run-at-app-root.cjs");

require(helper);
