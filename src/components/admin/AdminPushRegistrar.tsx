"use client";

import { useEffect, useRef } from "react";

type SrkAdminBridge = {
  getFcmToken?: () => string | null | undefined;
};

declare global {
  interface Window {
    SrkAdmin?: SrkAdminBridge;
    __SRK_FCM_TOKEN__?: string;
  }
}

async function registerToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return;
  try {
    await fetch("/api/admin/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: trimmed, platform: "android" }),
    });
  } catch (error) {
    console.warn("[AdminPushRegistrar] register failed:", error);
  }
}

function readBridgeToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromGlobal = window.__SRK_FCM_TOKEN__?.trim();
  if (fromGlobal) return fromGlobal;
  try {
    const fromBridge = window.SrkAdmin?.getFcmToken?.()?.trim();
    if (fromBridge) return fromBridge;
  } catch {
    /* bridge may throw if not ready */
  }
  return null;
}

/**
 * Registers the admin WebView APK FCM token with the server after login.
 * Android injects the token via:
 *   - window.__SRK_FCM_TOKEN__ = "..."
 *   - window.SrkAdmin.getFcmToken()
 *   - CustomEvent("srk-fcm-token", { detail: { token } })
 */
export function AdminPushRegistrar() {
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    const apply = (token: string | null | undefined) => {
      if (!token?.trim() || token === lastToken.current) return;
      lastToken.current = token.trim();
      void registerToken(token);
    };

    apply(readBridgeToken());

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      apply(detail?.token);
    };
    window.addEventListener("srk-fcm-token", onCustom);

    const interval = window.setInterval(() => {
      apply(readBridgeToken());
    }, 5000);

    return () => {
      window.removeEventListener("srk-fcm-token", onCustom);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
