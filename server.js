"use strict";

/**
 * cPanel / Passenger startup file.
 * Always binds PORT (same pattern as the smoke test), shows /__debug,
 * then tries to boot Next.js without taking over the port.
 */

var fs = require("fs");
var path = require("path");
var http = require("http");
var spawn = require("child_process").spawn;

var WRAPPER = "cpanel-wrapper-2026-09-19-debug";
var port = Number(process.env.PORT || process.env.PASSENGER_PORT || 3000);
var bootLog = [];
var bootError = "";
var status = "booting";
var nextServer = null;
var wrapperServer = null;

function log(message) {
  var line = new Date().toISOString() + " " + message;
  bootLog.push(line);
  if (bootLog.length > 80) bootLog.shift();
  console.log("[cpanel] " + message);
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return false;
  var lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  var loaded = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === "#") continue;
    var eq = line.indexOf("=");
    if (eq <= 0) continue;
    var key = line.slice(0, eq).trim();
    var val = line.slice(eq + 1).trim();
    if (
      (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') ||
      (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'")
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = val;
      loaded += 1;
    }
  }
  log("loaded " + loaded + " keys from " + path.basename(file));
  return true;
}

function loadAppEnv() {
  var found =
    loadEnvFile(path.join(__dirname, ".env")) ||
    loadEnvFile(path.join(__dirname, ".env.production")) ||
    loadEnvFile(path.join(__dirname, ".env.local"));
  if (!found) log("no .env file in app root");
}

function envSet(name) {
  var value = process.env[name];
  return Boolean(value && String(value).trim());
}

function pathnameOf(req) {
  return String(req.url || "/").split("?")[0];
}

function isDebug(req) {
  var p = pathnameOf(req);
  return p === "/__debug" || p === "/debug" || p === "/debug/" || p === "/__debug/";
}

function isHealth(req) {
  var p = pathnameOf(req);
  return p === "/api/health" || p === "/api/health/";
}

function debugPayload() {
  var standalone = path.join(__dirname, ".next", "standalone", "server.js");
  return {
    wrapper: WRAPPER,
    status: status,
    nextReady: Boolean(nextServer),
    error: bootError || null,
    node: process.version,
    port: port,
    cwd: process.cwd(),
    startupFile: __filename,
    standalone: fs.existsSync(standalone),
    packWaiting: fs.existsSync(path.join(__dirname, "pack.tar.gz")),
    env: {
      DATABASE_URL: envSet("DATABASE_URL"),
      AUTH_SECRET: envSet("AUTH_SECRET"),
      NEXTAUTH_SECRET: envSet("NEXTAUTH_SECRET"),
      AUTH_TRUST_HOST: envSet("AUTH_TRUST_HOST"),
      EMAIL_SMTP_HOST: envSet("EMAIL_SMTP_HOST"),
      RAZORPAY_KEY_ID: envSet("RAZORPAY_KEY_ID"),
    },
    log: bootLog.slice(-40),
    timestamp: new Date().toISOString(),
  };
}

function sendDebug(res) {
  var data = debugPayload();
  var rows =
    "<tr><th>Status</th><td>" + esc(data.status) + "</td></tr>" +
    "<tr><th>Next.js</th><td>" + (data.nextReady ? "ready" : "not started") + "</td></tr>" +
    "<tr><th>Node</th><td>" + esc(data.node) + "</td></tr>" +
    "<tr><th>PORT</th><td>" + esc(data.port) + "</td></tr>" +
    "<tr><th>DATABASE_URL</th><td>" + (data.env.DATABASE_URL ? "set" : "MISSING") + "</td></tr>" +
    "<tr><th>AUTH_SECRET</th><td>" + (data.env.AUTH_SECRET ? "set" : "missing") + "</td></tr>" +
    "<tr><th>standalone/server.js</th><td>" + (data.standalone ? "found" : "MISSING") + "</td></tr>" +
    "<tr><th>pack.tar.gz</th><td>" + (data.packWaiting ? "waiting to extract" : "not present") + "</td></tr>" +
    "<tr><th>Error</th><td>" + esc(data.error || "none") + "</td></tr>";
  var logs = data.log.map(function (line) {
    return esc(line);
  }).join("\n");
  var html =
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>SRK debug</title>" +
    "<meta http-equiv='refresh' content='8'>" +
    "<style>body{font-family:sans-serif;padding:1.5rem;max-width:52rem;color:#111}" +
    "h1{color:#b45309}table{border-collapse:collapse;width:100%}" +
    "th,td{border:1px solid #ddd;padding:.45rem .6rem;text-align:left}" +
    "th{width:12rem;background:#f8fafc}pre{background:#0f172a;color:#e2e8f0;padding:1rem;overflow:auto}</style>" +
    "</head><body>" +
    "<h1>SRK debug</h1>" +
    "<p>This page stays up even if the shop fails to boot. Shop: <a href='/'>/</a></p>" +
    "<table>" + rows + "</table>" +
    "<h2>Boot log</h2><pre>" + logs + "</pre>" +
    "</body></html>";
  res.writeHead(data.nextReady ? 200 : 503, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function sendHealth(res) {
  var data = debugPayload();
  res.writeHead(data.nextReady && data.env.DATABASE_URL ? 200 : 503, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data, null, 2));
}

function handleRequest(req, res) {
  if (isDebug(req)) {
    sendDebug(res);
    return;
  }
  if (isHealth(req)) {
    sendHealth(res);
    return;
  }
  if (nextServer) {
    nextServer.emit("request", req, res);
    return;
  }
  sendDebug(res);
}

function extractPack(done) {
  var pack = path.join(__dirname, "pack.tar.gz");
  if (!fs.existsSync(pack)) {
    log("no pack.tar.gz (using files already on disk)");
    done();
    return;
  }
  log("extracting pack.tar.gz");
  var child = spawn("tar", ["-xzf", "pack.tar.gz"], {
    cwd: __dirname,
    env: Object.assign({}, process.env, {
      PATH: (process.env.PATH || "") + ":/usr/bin:/bin",
    }),
  });
  child.stderr.on("data", function (chunk) {
    log("tar: " + String(chunk).trim());
  });
  child.on("error", function (err) {
    bootError = err.message || String(err);
    log("tar failed: " + bootError);
    done();
  });
  child.on("close", function (code) {
    if (code === 0) {
      try {
        fs.unlinkSync(pack);
      } catch (e) {}
      log("pack extracted");
    } else {
      bootError = "tar exited " + code;
      log(bootError);
    }
    loadAppEnv();
    done();
  });
}

function bootNext() {
  var nodeMajor = parseInt(String(process.versions.node).split(".")[0], 10);
  if (!(nodeMajor >= 20)) {
    status = "failed";
    bootError = "Node " + process.version + " is too old; set Setup Node.js App to 20/22/24";
    log(bootError);
    return;
  }

  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  var standalone = path.join(__dirname, ".next", "standalone", "server.js");
  if (!fs.existsSync(standalone)) {
    status = "failed";
    bootError = "Missing .next/standalone/server.js";
    log(bootError);
    return;
  }

  try {
    process.chdir(path.dirname(standalone));
    log("chdir " + process.cwd());
    require(standalone);
    status = nextServer ? "ready" : "failed";
    if (!nextServer) {
      bootError = "Next.js loaded but did not create an HTTP server";
      log(bootError);
    } else {
      log("Next.js ready");
    }
  } catch (err) {
    status = "failed";
    bootError = err && err.stack ? err.stack : String(err);
    log("Next.js boot failed: " + (err && err.message ? err.message : err));
  }
}

process.on("uncaughtException", function (err) {
  bootError = err && err.stack ? err.stack : String(err);
  if (status !== "ready") status = "failed";
  log("uncaughtException: " + (err && err.message ? err.message : err));
});

process.on("unhandledRejection", function (err) {
  var message = err && err.message ? err.message : String(err);
  log("unhandledRejection: " + message);
  if (status !== "ready") {
    status = "failed";
    bootError = String(err && err.stack ? err.stack : err);
  }
});

loadAppEnv();

var origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function () {
  if (this._srkWrapper) {
    return origListen.apply(this, arguments);
  }
  nextServer = this;
  log("captured Next.js listen(); keeping wrapper on PORT " + port);
  this.address = function () {
    return { port: port, address: "127.0.0.1", family: "IPv4" };
  };
  var args = Array.prototype.slice.call(arguments);
  var cb;
  for (var i = 0; i < args.length; i++) {
    if (typeof args[i] === "function") cb = args[i];
  }
  var self = this;
  process.nextTick(function () {
    self.emit("listening");
    if (cb) cb();
  });
  return this;
};

wrapperServer = http.createServer(handleRequest);
wrapperServer._srkWrapper = true;
wrapperServer.listen(port, function () {
  log("debug wrapper listening on PORT " + port + " Node " + process.version);
  extractPack(function () {
    bootNext();
  });
});
