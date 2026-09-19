"use strict";

/**
 * TEMPORARY Hostinger Node.js smoke test.
 * Revert this commit after the page loads.
 */

var http = require("http");

var port = Number(process.env.PORT || process.env.PASSENGER_PORT || 3000);

var server = http.createServer(function (req, res) {
  var url = String(req.url || "/").split("?")[0];
  var body =
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>SRK Node test</title></head>" +
    "<body style='font-family:sans-serif;padding:2rem;max-width:40rem'>" +
    "<h1 style='color:#15803d'>SRK Node.js test OK</h1>" +
    "<p>If you see this, Hostinger Node is running.</p>" +
    "<ul>" +
    "<li>Node <b>" + process.version + "</b></li>" +
    "<li>PORT <b>" + port + "</b></li>" +
    "<li>Request <b>" + url + "</b></li>" +
    "<li>DATABASE_URL <b>" + (process.env.DATABASE_URL ? "set" : "missing") + "</b></li>" +
    "<li>Time <b>" + new Date().toISOString() + "</b></li>" +
    "</ul>" +
    "</body></html>";
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
});

server.listen(port, function () {
  console.log("[srk-test] listening on PORT " + port + " with Node " + process.version);
});
