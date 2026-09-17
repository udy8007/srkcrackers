"use strict";

/**
 * cPanel / Passenger startup file (application root).
 * Does not require the `next` package from the Git repo node_modules.
 * Boots the Next.js standalone server produced by `npm run build:cpanel`.
 *
 * Upload layout:
 *   repositories/srkcrackers/server.js              (this file)
 *   repositories/srkcrackers/.next/standalone/      (pack output)
 */

const fs = require("node:fs");
const path = require("node:path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

if (!process.env.PORT && process.env.PASSENGER_PORT) {
  process.env.PORT = String(process.env.PASSENGER_PORT);
}

// Passenger often sets HOSTNAME to the machine name; Next then binds incorrectly.
if (
  process.env.HOSTNAME &&
  process.env.HOSTNAME !== "127.0.0.1" &&
  process.env.HOSTNAME !== "0.0.0.0" &&
  process.env.HOSTNAME !== "localhost"
) {
  process.env.HOSTNAME = "127.0.0.1";
}

const standaloneDir = path.join(__dirname, ".next", "standalone");
const standaloneServer = path.join(standaloneDir, "server.js");

if (!fs.existsSync(standaloneServer)) {
  const http = require("node:http");
  const htmlPath = path.join(__dirname, "public", "srk-contact.html");
  const html = fs.existsSync(htmlPath)
    ? fs.readFileSync(htmlPath)
    : Buffer.from(
        "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:2rem'>" +
          "<h1>SRK Crackers</h1><p>Website is temporarily down.</p>" +
          "<p><a href='https://wa.me/919841916899'>WhatsApp 98419 16899</a></p>" +
          "</body></html>",
      );
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOSTNAME || "127.0.0.1";
  http
    .createServer((req, res) => {
      res.writeHead(503, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "120",
      });
      res.end(html);
    })
    .listen(port, host, () => {
      console.error("[cpanel] Missing .next/standalone/server.js — serving site-down page on", host, port);
    });
} else {

  process.chdir(standaloneDir);
  require(standaloneServer);
}
