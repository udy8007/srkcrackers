"use client";

import { useEffect } from "react";

const SESSION_KEY = "srk_visit_logged";

/** Fire-and-forget visit beacon once per browser session. */
export function VisitTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    void fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {
      sessionStorage.removeItem(SESSION_KEY);
    });
  }, []);

  return null;
}
