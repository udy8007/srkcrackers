"use strict";

/**
 * Optional startup file (copied next to standalone/server.js by build:cpanel).
 * At the Git application root, prefer repo-root server.js instead.
 */
const fs = require("node:fs");
const path = require("node:path");

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
