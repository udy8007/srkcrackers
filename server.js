"use strict";

/**
 * cPanel / Passenger startup file (application root).
 *
 * Upload this file to the Node.js app root, e.g.:
 *   /home/srkcrack/srkcrackers/server.js
 * Startup file in cPanel must be: server.js  (this file, not .next/standalone/server.js)
 *
 * Node.js version MUST be 20+ (Setup Node.js App → Node.js version).
 * System /usr/bin/node is often v10 and cannot load Next.js 15.
 *
 * /api/health is answered HERE so Git/File Manager update of this one file
 * is enough to see env + Turso status (the old Next pack does not include that).
 */

var nodeMajor = parseInt(String(process.versions.node).split(".")[0], 10);
if (!(nodeMajor >= 20)) {
  var msg =
    "SRK Crackers needs Node.js 20 or newer. This process is Node " +
    process.version +
    ". In cPanel open Setup Node.js App, set Node.js version to 20/22/24, Save, then Restart.";
  console.error("[cpanel] " + msg);
  process.stderr.write(msg + "\n");
  process.exit(1);
}

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const WRAPPER = "cpanel-wrapper-2026-09-18b";

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

function envRaw(name) {
  const value = process.env[name];
  if (!value) return "";
  let next = String(value).trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

function envSet(name) {
  return Boolean(envRaw(name));
}

function isHealth(req) {
  const pathname = String(req.url || "").split("?")[0];
  return pathname === "/api/health" || pathname === "/api/health/";
}

function probeTurso() {
  return new Promise((resolve) => {
    let url = envRaw("TURSO_DATABASE_URL") || envRaw("DATABASE_URL");
    const token = envRaw("TURSO_AUTH_TOKEN");
    if (!url) {
      resolve({ ok: false, error: "TURSO_DATABASE_URL / DATABASE_URL missing in Passenger env" });
      return;
    }
    if (url.startsWith("libsql://")) url = `https://${url.slice("libsql://".length)}`;
    if (!url.startsWith("https://")) {
      resolve({ ok: false, error: "DATABASE_URL is not a Turso libsql/https URL" });
      return;
    }
    if (!token) {
      resolve({ ok: false, error: "TURSO_AUTH_TOKEN missing in Passenger env" });
      return;
    }

    const endpoint = `${url.replace(/\/$/, "")}/v2/pipeline`;
    let parsed;
    try {
      parsed = new URL(endpoint);
    } catch (err) {
      resolve({ ok: false, error: `invalid Turso URL: ${err instanceof Error ? err.message : "parse"}` });
      return;
    }

    const payload = JSON.stringify({
      requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }],
    });

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8").slice(0, 240);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, error: null });
            return;
          }
          resolve({ ok: false, error: `turso HTTP ${res.statusCode}: ${text}` });
        });
      },
    );
    req.on("error", (err) => {
      resolve({ ok: false, error: `turso network: ${err.message}` });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ ok: false, error: "turso timeout (8s) — host may block outbound HTTPS" });
    });
    req.end(payload);
  });
}

async function healthPayload() {
  const standaloneDir = path.join(__dirname, ".next", "standalone");
  const standaloneServer = path.join(standaloneDir, "server.js");
  const turso = await probeTurso();
  return {
    status: turso.ok ? "ok" : "degraded",
    database: turso.ok ? "up" : "down",
    wrapper: WRAPPER,
    standalone: fs.existsSync(standaloneServer),
    cwd: process.cwd(),
    startupFile: __filename,
    node: process.version,
    env: {
      TURSO_DATABASE_URL: envSet("TURSO_DATABASE_URL"),
      TURSO_AUTH_TOKEN: envSet("TURSO_AUTH_TOKEN"),
      DATABASE_URL: envSet("DATABASE_URL"),
      AUTH_SECRET: envSet("AUTH_SECRET"),
      NEXTAUTH_SECRET: envSet("NEXTAUTH_SECRET"),
      AUTH_TRUST_HOST: envSet("AUTH_TRUST_HOST"),
      NEXTAUTH_URL: envSet("NEXTAUTH_URL"),
      AUTH_URL: envSet("AUTH_URL"),
      CRON_SECRET: envSet("CRON_SECRET"),
    },
    error: turso.error,
    timestamp: new Date().toISOString(),
  };
}

function sendHealth(_req, res) {
  healthPayload()
    .then((body) => {
      const code = body.database === "up" ? 200 : 503;
      res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-SRK-Health": WRAPPER,
      });
      res.end(JSON.stringify(body));
    })
    .catch((err) => {
      res.writeHead(503, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-SRK-Health": WRAPPER,
      });
      res.end(
        JSON.stringify({
          status: "degraded",
          database: "down",
          wrapper: WRAPPER,
          error: err instanceof Error ? err.message : "health failed",
          timestamp: new Date().toISOString(),
        }),
      );
    });
}

function wrapRequestListener(listener) {
  return function wrapped(req, res) {
    if (isHealth(req)) {
      sendHealth(req, res);
      return;
    }
    if (typeof listener === "function") listener.call(this, req, res);
  };
}

function installHealthIntercept() {
  const origCreateServer = http.createServer;
  http.createServer = function (options, listener) {
    if (typeof options === "function") {
      return origCreateServer.call(this, wrapRequestListener(options));
    }
    return origCreateServer.call(this, options, wrapRequestListener(listener));
  };

  const origOn = http.Server.prototype.on;
  http.Server.prototype.on = function (event, listener) {
    if (event === "request" && typeof listener === "function") {
      return origOn.call(this, event, wrapRequestListener(listener));
    }
    return origOn.apply(this, arguments);
  };
  http.Server.prototype.addListener = http.Server.prototype.on;
}

const standaloneDir = path.join(__dirname, ".next", "standalone");
const standaloneServer = path.join(standaloneDir, "server.js");

if (!fs.existsSync(standaloneServer)) {
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
      if (isHealth(req)) {
        sendHealth(req, res);
        return;
      }
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
  installHealthIntercept();
  process.chdir(standaloneDir);
  require(standaloneServer);
}
