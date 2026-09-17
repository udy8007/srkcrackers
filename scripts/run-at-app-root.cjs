"use strict";

/**
 * Prisma generate + Next build using the Git application root, not cwd.
 * CloudLinux npm often runs with cwd = ~/nodevenv/<app>/<node-major>/lib
 * while npm_package_json points at ~/repositories/<app>/package.json.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function resolveAppRoot() {
  if (process.env.npm_package_json) {
    return path.dirname(fs.realpathSync(process.env.npm_package_json));
  }
  return path.join(__dirname, "..");
}

function resolvePackageFile(pkgName, relativeFile, bases) {
  for (const base of bases) {
    try {
      const pkgJson = require.resolve(`${pkgName}/package.json`, { paths: [base] });
      return path.join(path.dirname(pkgJson), relativeFile);
    } catch {
      // try next location (app root or nodevenv/lib)
    }
  }
  return null;
}

function runNodeCli(cliFile, args, cwd, moduleBases) {
  if (!cliFile) {
    throw new Error(`[run-at-app-root] CLI not found: ${args.join(" ")}`);
  }

  const env = { ...process.env };
  const bins = moduleBases.map((dir) => path.join(dir, "node_modules", ".bin"));
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
  if (process.argv[2] === "generate" || process.argv[2] === "build") return process.argv[2];
  if (process.env.npm_lifecycle_event === "build") return "build";
  return "generate";
}

const appRoot = resolveAppRoot();
const schema = path.join(appRoot, "prisma", "schema.prisma");
const moduleBases = [process.cwd(), appRoot];
const task = resolveTask();

const prismaCli = resolvePackageFile("prisma", "build/index.js", moduleBases);
const nextCli = resolvePackageFile("next", "dist/bin/next", moduleBases);

runNodeCli(prismaCli, ["generate", "--schema", schema], appRoot, moduleBases);

if (task === "build") {
  runNodeCli(nextCli, ["build"], appRoot, moduleBases);
}
