"use strict";

/**
 * Production HTTP server for cPanel / CloudLinux "Setup Node.js App".
 * Serves the Next.js app and App Router API routes together (one process).
 *
 * Startup file: server.js
 * Start: node server.js
 */

const { createServer } = require("http");
const next = require("next");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

if (!process.env.PORT && process.env.PASSENGER_PORT) {
  process.env.PORT = String(process.env.PASSENGER_PORT);
}

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";

const app = next({
  dev: false,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`Next.js server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
