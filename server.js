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

var WRAPPER = "cpanel-wrapper-2026-09-19-assets";
var port = Number(process.env.PORT || process.env.PASSENGER_PORT || 3000);
var KNOWN_ROOTS = {
  _next: 1,
  api: 1,
  admin: 1,
  crackers: 1,
  "1000-wala": 1,
  products: 1,
  shop: 1,
  lottie: 1,
  videos: 1,
  images: 1,
  abc: 1,
  "favicon.ico": 1,
  "robots.txt": 1,
  "sitemap.xml": 1,
  "srk-contact.html": 1,
  __debug: 1,
  debug: 1,
  images: 1,
};
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

function passengerBase() {
  var raw =
    process.env.PASSENGER_BASE_URI ||
    process.env.PASSENGER_APP_BASE_URI ||
    process.env.BASE_PATH ||
    "";
  raw = String(raw).trim();
  if (!raw || raw === "/") return "";
  if (raw.charAt(0) !== "/") raw = "/" + raw;
  return raw.replace(/\/+$/, "");
}

function detectMountFromUrl(url) {
  var pathname = String(url || "/").split("?")[0];
  var base = passengerBase();
  if (!base) {
    var first = pathname.split("/").filter(Boolean)[0] || "";
    if (first && !KNOWN_ROOTS[first]) base = "/" + first;
  }
  if (!base) return "";
  if (pathname === base || pathname.indexOf(base + "/") === 0) return base;
  return "";
}

function stripMount(req) {
  var url = String(req.url || "/");
  var q = url.indexOf("?");
  var pathname = q === -1 ? url : url.slice(0, q);
  var query = q === -1 ? "" : url.slice(q);
  var base = detectMountFromUrl(url);
  if (!base) return;
  var rest = pathname.slice(base.length) || "/";
  if (rest.charAt(0) !== "/") rest = "/" + rest;
  req.url = rest + query;
}

function shouldRewriteBody(contentType) {
  var ct = String(contentType || "").toLowerCase();
  return (
    ct.indexOf("text/html") !== -1 ||
    ct.indexOf("javascript") !== -1 ||
    ct.indexOf("text/css") !== -1 ||
    ct.indexOf("json") !== -1 ||
    ct.indexOf("text/x-component") !== -1
  );
}

function prefixAssetUrls(text, mount) {
  if (!mount || !text) return text;
  text = String(text);
  var paths = [
    "/_next/",
    "/images/",
    "/shop/",
    "/products/",
    "/lottie/",
    "/videos/",
    "/admin",
    "/api/",
    "/crackers/",
    "/1000-wala",
    "/favicon.ico",
    "/logo.png",
  ];
  for (var i = 0; i < paths.length; i++) {
    var p = paths[i];
    var already = mount + p;
    text = text.split(already).join(p);
    text = text.split(p).join(already);
  }
  text = text.replace(/"assetPrefix":""/g, '"assetPrefix":"' + mount + '"');
  text = text.replace(/"assetPrefix":null/g, '"assetPrefix":"' + mount + '"');
  return text;
}

function rewritePublicAliases(req) {
  // Public files are served by Next under NEXT_PUBLIC_BASE_PATH.
}

function prefixLocation(value, mount) {
  var loc = String(value || "");
  if (!loc || loc.charAt(0) !== "/" || loc.indexOf("//") === 0) return loc;
  if (loc === mount || loc.indexOf(mount + "/") === 0) return loc;
  return mount + loc;
}

function forwardToNext(req, res, mount) {
  if (!mount) {
    nextServer.emit("request", req, res);
    return;
  }

  req.headers["accept-encoding"] = "identity";

  var chunks = [];
  var statusCode = 200;
  var buffering = null;
  var origSetHeader = res.setHeader.bind(res);
  var origGetHeader = res.getHeader.bind(res);
  var origWriteHead = res.writeHead.bind(res);
  var origWrite = res.write.bind(res);
  var origEnd = res.end.bind(res);

  function contentType() {
    return origGetHeader("content-type") || "";
  }

  function decideBuffer() {
    if (buffering !== null) return buffering;
    buffering = shouldRewriteBody(contentType());
    return buffering;
  }

  res.setHeader = function (name, value) {
    if (String(name).toLowerCase() === "location") {
      value = prefixLocation(value, mount);
    }
    return origSetHeader(name, value);
  };

  res.writeHead = function (code, a, b) {
    statusCode = code;
    var hd = b;
    if (typeof a === "object") hd = a;
    if (hd) {
      Object.keys(hd).forEach(function (key) {
        res.setHeader(key, hd[key]);
      });
    }
    decideBuffer();
    if (!buffering) {
      return origWriteHead.call(res, code);
    }
    return res;
  };

  res.write = function (chunk, enc, cb) {
    decideBuffer();
    if (buffering) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof enc === "string" ? enc : "utf8"));
      }
      if (typeof enc === "function") enc();
      else if (typeof cb === "function") cb();
      return true;
    }
    if (!res.headersSent) origWriteHead.call(res, statusCode);
    return origWrite.apply(res, arguments);
  };

  res.end = function (chunk, enc, cb) {
    if (chunk && (typeof chunk !== "function")) {
      res.write(chunk, typeof enc === "string" ? enc : undefined);
    }
    var done = typeof enc === "function" ? enc : cb;
    decideBuffer();
    if (buffering) {
      var body = prefixAssetUrls(Buffer.concat(chunks).toString("utf8"), mount);
      var buf = Buffer.from(body, "utf8");
      origSetHeader("content-length", String(buf.length));
      origWriteHead.call(res, statusCode);
      return origEnd.call(res, buf, done);
    }
    return origEnd.apply(res, arguments);
  };

  nextServer.emit("request", req, res);
}

function isDebug(req) {
  var p = pathnameOf(req).replace(/\/+$/, "") || "/";
  return /(^|\/)(__debug|debug)$/.test(p);
}

function isHealth(req) {
  var p = pathnameOf(req).replace(/\/+$/, "") || "/";
  return /(^|\/)api\/health$/.test(p);
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
    mount: passengerBase() || "(auto)",
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

function debugRows(data) {
  return (
    "<tr><th>Status</th><td>" + esc(data.status) + "</td></tr>" +
    "<tr><th>Next.js</th><td>" + (data.nextReady ? "ready" : "not started") + "</td></tr>" +
    "<tr><th>Node</th><td>" + esc(data.node) + "</td></tr>" +
    "<tr><th>PORT</th><td>" + esc(data.port) + "</td></tr>" +
    "<tr><th>DATABASE_URL</th><td>" + (data.env.DATABASE_URL ? "set" : "MISSING") + "</td></tr>" +
    "<tr><th>AUTH_SECRET</th><td>" + (data.env.AUTH_SECRET ? "set" : "missing") + "</td></tr>" +
    "<tr><th>standalone/server.js</th><td>" + (data.standalone ? "found" : "MISSING") + "</td></tr>" +
    "<tr><th>pack.tar.gz</th><td>" + (data.packWaiting ? "waiting to extract" : "not present") + "</td></tr>" +
    "<tr><th>URL prefix</th><td>" + esc(data.mount || "") + "</td></tr>" +
    "<tr><th>Error</th><td>" + esc(data.error || "none") + "</td></tr>"
  );
}

function sendDownPage(res, openServer) {
  var data = debugPayload();
  var logs = data.log.map(function (line) {
    return esc(line);
  }).join("\n");
  var html =
    "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'>" +
    "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
    "<title>SRK Crackers — Website temporarily down</title>" +
    "<meta name='theme-color' content='#9d0208'>" +
    "<style>" +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    "body{font-family:Poppins,system-ui,sans-serif;color:#fff;min-height:100vh;" +
    "background:radial-gradient(ellipse at 20% 0%,#c1121f 0%,#6a040f 42%,#1a0508 100%)}" +
    ".wrap{max-width:720px;margin:0 auto;padding:28px 18px 48px}" +
    ".hero{text-align:center;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));" +
    "border:1px solid rgba(255,195,0,.35);border-radius:28px;padding:28px 20px 24px;" +
    "box-shadow:0 20px 50px rgba(0,0,0,.28)}" +
    ".logo{width:168px;height:168px;margin:0 auto 14px;border-radius:50%;padding:8px;" +
    "background:conic-gradient(from 200deg,#ffc300,#f77f00,#d62828,#ffc300);" +
    "box-shadow:0 0 0 6px rgba(255,195,0,.18),0 12px 32px rgba(0,0,0,.35)}" +
    ".logo-inner{width:100%;height:100%;border-radius:50%;background:#9d0208;display:grid;place-items:center;" +
    "border:4px solid #fff8f2}" +
    ".logo-inner strong{font-size:2rem;letter-spacing:.04em}" +
    ".logo-inner small{display:block;color:#ffc300;font-weight:700;letter-spacing:.18em;font-size:.62rem}" +
    ".status{display:inline-flex;align-items:center;gap:8px;background:rgba(0,0,0,.35);" +
    "border:1px solid rgba(255,195,0,.55);color:#ffc300;font-weight:700;font-size:.78rem;" +
    "letter-spacing:.12em;text-transform:uppercase;border-radius:999px;padding:8px 14px;margin-bottom:14px}" +
    ".status i{width:9px;height:9px;border-radius:50%;background:#ffc300}" +
    ".brand{font-size:2rem;font-weight:800}" +
    ".tag{margin-top:4px;color:#ffc300;font-weight:600}" +
    ".msg{margin:12px auto 0;max-width:28rem;color:rgba(255,255,255,.9);line-height:1.5}" +
    ".cta-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:16px}" +
    ".cta{display:inline-flex;align-items:center;border:0;cursor:pointer;text-decoration:none;" +
    "border-radius:999px;padding:12px 18px;font-weight:700;color:#fff;font:inherit}" +
    ".cta-wa{background:#25d366}.cta-call{background:#2da815}" +
    ".cta-retry{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28)}" +
    ".cta-server{background:#ffc300;color:#4a2a00}" +
    ".addr{margin-top:10px;color:rgba(255,255,255,.86);font-size:.88rem}" +
    ".pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}" +
    ".pill{background:rgba(0,0,0,.22);border:1px solid rgba(255,195,0,.28);border-radius:999px;padding:6px 12px;font-size:.75rem}" +
    ".server-box{display:none;margin-top:18px;text-align:left;background:rgba(0,0,0,.38);" +
    "border:1px solid rgba(255,195,0,.28);border-radius:18px;padding:16px}" +
    ".server-box.open{display:block}" +
    ".server-box h2{color:#ffc300;font-size:1rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}" +
    "table{width:100%;border-collapse:collapse;font-size:.9rem}" +
    "th,td{border-bottom:1px solid rgba(255,255,255,.12);padding:8px;text-align:left;vertical-align:top}" +
    "th{width:11rem;color:#ffc300}" +
    "pre{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:12px;overflow:auto;white-space:pre-wrap;margin-top:12px}" +
    "</style></head><body><main class='wrap'><section class='hero'>" +
    "<div class='logo'><div class='logo-inner'><div><strong>SRK</strong><small>CRACKERS</small></div></div></div>" +
    "<div class='status'><i></i> Website temporarily down</div>" +
    "<div class='brand'>SRK Crackers</div>" +
    "<div class='tag'>Licensed Fireworks Dealer · Avadi, Chennai</div>" +
    "<p class='msg'>The online shop is offline for a short time. You can still order — WhatsApp or call us now. We will confirm your list quickly.</p>" +
    "<div class='cta-row'>" +
    "<a class='cta cta-wa' href='https://wa.me/919841916899?text=Hi%20SRK%20Crackers%2C%20the%20website%20is%20down.%20I%20want%20to%20place%20an%20order.'>WhatsApp order</a>" +
    "<a class='cta cta-call' href='tel:+919841916899'>Call 98419 16899</a>" +
    "<a class='cta cta-retry' href='/'>Try website again</a>" +
    "<button type='button' class='cta cta-server' id='serverBtn'>Server</button>" +
    "</div>" +
    "<p class='addr'>No 45, Sarathi Nagar, Morai Village<br>Avadi, Chennai - 600055, Tamil Nadu</p>" +
    "<div class='pills'><span class='pill'>GST 33BJBPR5461B2ZI</span>" +
    "<span class='pill'>Licence 10439/FL/NMSB/2026</span>" +
    "<span class='pill'>9:00 AM – 9:00 PM</span></div>" +
    "<section class='server-box" + (openServer ? " open" : "") + "' id='serverPanel'>" +
    "<h2>Server status</h2><table>" + debugRows(data) + "</table>" +
    "<pre>" + logs + "</pre></section>" +
    "</section></main>" +
    "<script>document.getElementById('serverBtn').onclick=function(){document.getElementById('serverPanel').classList.add('open');};" +
    (openServer ? "document.getElementById('serverPanel').classList.add('open');" : "") +
    "</script></body></html>";
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

function sendHealth(res) {
  var data = debugPayload();
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data, null, 2));
}

function nextBasePath() {
  return "";
}

function stripLegacyAbc(req) {
  var url = String(req.url || "/");
  var q = url.indexOf("?");
  var pathname = q === -1 ? url : url.slice(0, q);
  var query = q === -1 ? "" : url.slice(q);
  if (pathname === "/abc" || pathname === "/abc/") {
    req.url = "/" + query;
    return;
  }
  if (pathname.indexOf("/abc/") === 0) {
    req.url = pathname.slice(4) + query;
  }
}

function handleRequest(req, res) {
  stripLegacyAbc(req);
  var builtBase = nextBasePath();
  var mount = builtBase ? "" : detectMountFromUrl(req.url);
  if (!builtBase) {
    stripMount(req);
  }
  rewritePublicAliases(req);
  if (mount || builtBase) {
    req.headers["x-forwarded-prefix"] = builtBase || mount;
    req.headers["x-base-path"] = builtBase || mount;
  }
  if (isHealth(req)) {
    sendHealth(res);
    return;
  }
  if (isDebug(req)) {
    sendDownPage(res, true);
    return;
  }
  if (nextServer) {
    forwardToNext(req, res, mount);
    return;
  }
  sendDownPage(res, false);
}

function standalonePath() {
  return path.join(__dirname, ".next", "standalone", "server.js");
}

function packSizeMb(file) {
  try {
    return (fs.statSync(file).size / (1024 * 1024)).toFixed(1);
  } catch (e) {
    return "?";
  }
}

function extractPack(done) {
  var pack = path.join(__dirname, "pack.tar.gz");
  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    done();
  }

  if (!fs.existsSync(pack)) {
    log("no pack.tar.gz (using files already on disk)");
    finish();
    return;
  }

  log("extracting pack.tar.gz (" + packSizeMb(pack) + " MB)");
  var child = spawn("tar", ["-xzf", "pack.tar.gz"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
    env: Object.assign({}, process.env, {
      PATH: (process.env.PATH || "") + ":/usr/bin:/bin",
    }),
  });
  child.stdout.on("data", function (chunk) {
    log("tar: " + String(chunk).trim().slice(0, 180));
  });
  child.stderr.on("data", function (chunk) {
    log("tar: " + String(chunk).trim().slice(0, 180));
  });
  child.on("error", function (err) {
    bootError = err.message || String(err);
    log("tar failed: " + bootError);
    finish();
  });
  child.on("close", function (code) {
    clearTimeout(timer);
    if (code === 0) {
      try {
        fs.unlinkSync(pack);
      } catch (e) {}
      log("pack extracted");
    } else {
      log("tar exited " + code + " (keeping files already on disk)");
    }
    loadAppEnv();
    finish();
  });
  var timer = setTimeout(function () {
    log("tar still running after 90s; starting shop with files already on disk");
    try {
      child.kill();
    } catch (e) {}
    finish();
  }, 90000);
}

function bootNext() {
  if (nextServer) {
    log("Next.js already running");
    return;
  }
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
  log("application prefix " + (passengerBase() || "(none, will auto-strip unknown first path)"));
  if (fs.existsSync(standalonePath())) {
    log("standalone already present; starting shop without waiting for tar");
    bootNext();
  }
  extractPack(function () {
    if (!nextServer) bootNext();
  });
});
