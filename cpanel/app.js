"use strict";

/**
 * Optional startup file (copied next to standalone/server.js by build:cpanel).
 * At the Git application root, prefer repo-root server.js instead.
 */
var nodeMajor = parseInt(String(process.versions.node).split(".")[0], 10);
if (!(nodeMajor >= 20)) {
  console.error(
    "[cpanel] Needs Node.js 20+. This process is Node " +
      process.version +
      ". Set the version in cPanel Setup Node.js App, then Restart.",
  );
  process.exit(1);
}

const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

if (!process.env.PORT && process.env.PASSENGER_PORT) {
  process.env.PORT = String(process.env.PASSENGER_PORT);
}

if (
  process.env.HOSTNAME &&
  process.env.HOSTNAME !== "127.0.0.1" &&
  process.env.HOSTNAME !== "0.0.0.0" &&
  process.env.HOSTNAME !== "localhost"
) {
  process.env.HOSTNAME = "127.0.0.1";
}

const nested = path.join(__dirname, ".next", "standalone", "server.js");
if (fs.existsSync(nested)) {
  process.chdir(path.dirname(nested));
  require(nested);
} else {
  process.chdir(__dirname);
  require(path.join(__dirname, "server.js"));
}
