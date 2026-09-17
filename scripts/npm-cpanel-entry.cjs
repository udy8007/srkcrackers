"use strict";

/**
 * cPanel-safe npm lifecycle entry.
 * package.json must require this file by absolute path:
 *   path.join(dirname(npm_package_json), "scripts", "npm-cpanel-entry.cjs")
 */

const path = require("node:path");

const packageJson = process.env.npm_package_json;
if (!packageJson) {
  console.error("[npm-cpanel-entry] process.env.npm_package_json is missing");
  process.exit(1);
}

const appRoot = path.dirname(packageJson);
require(path.join(appRoot, "scripts", "run-at-app-root.cjs"));
