"use strict";

/**
 * Optional Passenger wrapper used only by `npm run build:cpanel`
 * (standalone zip upload). Preferred GitHub deploy uses repo-root server.js.
 *
 * Setup Node.js App for the full repository:
 *   Application root: repositories/srkcrackers
 *   Startup file: server.js
 */
const path = require("path");

process.chdir(__dirname);

// Passenger/cPanel often sets HOSTNAME to the machine name, which makes
// Next.js bind on the wrong interface. Loopback; the proxy talks to PORT.
process.env.HOSTNAME = "127.0.0.1";

if (!process.env.PORT && process.env.PASSENGER_PORT) {
  process.env.PORT = String(process.env.PASSENGER_PORT);
}

require(path.join(__dirname, "server.js"));
