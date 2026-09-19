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
 * is enough to see env + MySQL status (the old Next pack does not include that).
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

const WRAPPER = "cpanel-wrapper-2026-09-19-pack";

process.env.NODE_ENV = process.env.NODE_ENV || "production";

function extractDeployPack() {
  const pack = path.join(__dirname, "pack.tar.gz");
  if (!fs.existsSync(pack)) return;
  console.log("[cpanel] extracting pack.tar.gz");
  try {
    require("child_process").execSync("tar -xzf pack.tar.gz", {
      cwd: __dirname,
      stdio: "inherit",
      env: Object.assign({}, process.env, {
        PATH: (process.env.PATH || "") + ":/usr/bin:/bin",
      }),
    });
    fs.unlinkSync(pack);
    console.log("[cpanel] pack extracted");
  } catch (err) {
    console.error("[cpanel] pack extract failed:", err instanceof Error ? err.message : err);
  }
}

extractDeployPack();

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

function probeMysql() {
  return new Promise((resolve) => {
    const url = envRaw("DATABASE_URL");
    if (!url) {
      resolve({ ok: false, error: "DATABASE_URL missing in Passenger env" });
      return;
    }
    if (!/^mysql(s)?:\/\//i.test(url)) {
      resolve({ ok: false, error: "DATABASE_URL is not a mysql:// URL" });
      return;
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      resolve({ ok: false, error: `invalid DATABASE_URL: ${err instanceof Error ? err.message : "parse"}` });
      return;
    }

    const port = Number(parsed.port) || 3306;
    const socket = require("net").connect({ host: parsed.hostname, port }, () => {
      socket.end();
      resolve({ ok: true, error: null });
    });
    socket.on("error", (err) => {
      resolve({ ok: false, error: `mysql network: ${err.message}` });
    });
    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({ ok: false, error: "mysql timeout (8s) — host or port may be blocked" });
    });
  });
}

async function healthPayload() {
  const standaloneDir = path.join(__dirname, ".next", "standalone");
  const standaloneServer = path.join(standaloneDir, "server.js");
  const mysql = await probeMysql();
  return {
    status: mysql.ok ? "ok" : "degraded",
    database: mysql.ok ? "up" : "down",
    wrapper: WRAPPER,
    standalone: fs.existsSync(standaloneServer),
    cwd: process.cwd(),
    startupFile: __filename,
    node: process.version,
    env: {
      DATABASE_URL: envSet("DATABASE_URL"),
      AUTH_SECRET: envSet("AUTH_SECRET"),
      NEXTAUTH_SECRET: envSet("NEXTAUTH_SECRET"),
      AUTH_TRUST_HOST: envSet("AUTH_TRUST_HOST"),
      CRON_SECRET: envSet("CRON_SECRET"),
    },
    error: mysql.error,
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
