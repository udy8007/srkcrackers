"use client";

import { useEffect, useRef } from "react";

type TokenGetter = () => string | null | undefined;

declare global {
  interface Window {
    SrkAdmin?: { getFcmToken?: TokenGetter };
    __SRK_FCM_TOKEN__?: string;
    Android?: Record<string, unknown>;
    AndroidBridge?: Record<string, unknown>;
    AndroidNotification?: Record<string, unknown>;
    WebViewJavascriptBridge?: Record<string, unknown>;
  }
}

export async function registerAdminFcmToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "Empty token" };
  try {
    const res = await fetch("/api/admin/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: trimmed, platform: "android" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

function callStringMethod(obj: unknown, method: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const fn = (obj as Record<string, unknown>)[method];
  if (typeof fn !== "function") return null;
  try {
    const value = (fn as TokenGetter).call(obj);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/** Probe common WebView JS bridges + globals for an FCM token. */
export function readBridgeToken(): string | null {
  if (typeof window === "undefined") return null;

  const fromGlobal = window.__SRK_FCM_TOKEN__?.trim();
  if (fromGlobal) return fromGlobal;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("fcm_token")?.trim() || params.get("fcmToken")?.trim();
  if (fromQuery) return fromQuery;

  const bridges: unknown[] = [
    window.SrkAdmin,
    window.Android,
    window.AndroidBridge,
    window.AndroidNotification,
  ];

  for (const bridge of bridges) {
    for (const method of ["getFcmToken", "getToken", "readToken", "getFirebaseToken", "fcmToken"]) {
      const token = callStringMethod(bridge, method);
      if (token) return token;
    }
  }

  return null;
}

export function describePushBridge(): {
  hasToken: boolean;
  tokenPreview: string | null;
  bridgesFound: string[];
} {
  if (typeof window === "undefined") {
    return { hasToken: false, tokenPreview: null, bridgesFound: [] };
  }

  const bridgesFound: string[] = [];
  if (window.SrkAdmin) bridgesFound.push("SrkAdmin");
  if (window.Android) bridgesFound.push("Android");
  if (window.AndroidBridge) bridgesFound.push("AndroidBridge");
  if (window.AndroidNotification) bridgesFound.push("AndroidNotification");
  if (window.__SRK_FCM_TOKEN__) bridgesFound.push("__SRK_FCM_TOKEN__");

  const token = readBridgeToken();
  return {
    hasToken: Boolean(token),
    tokenPreview: token ? `${token.slice(0, 12)}…${token.slice(-8)}` : null,
    bridgesFound,
  };
}

/**
 * Registers the admin WebView APK FCM token with the server after login.
 * Android must inject the token — opening the page alone is not enough.
 */
export function AdminPushRegistrar() {
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    const apply = (token: string | null | undefined) => {
      if (!token?.trim() || token === lastToken.current) return;
      lastToken.current = token.trim();
      void registerAdminFcmToken(token);
    };

    apply(readBridgeToken());

    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail;
      apply(detail?.token);
    };
    window.addEventListener("srk-fcm-token", onCustom);

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const token =
        (typeof record.fcmToken === "string" && record.fcmToken) ||
        (typeof record.token === "string" && record.type === "fcm" && record.token) ||
        null;
      apply(token);
    };
    window.addEventListener("message", onMessage);

    const interval = window.setInterval(() => {
      apply(readBridgeToken());
    }, 3000);

    return () => {
      window.removeEventListener("srk-fcm-token", onCustom);
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
