"use client";

import { useEffect, useRef } from "react";

type TokenGetter = (...args: unknown[]) => unknown;

declare global {
  interface Window {
    SrkAdmin?: Record<string, unknown>;
    __SRK_FCM_TOKEN__?: string;
    Android?: Record<string, unknown>;
    AndroidBridge?: Record<string, unknown>;
    AndroidNotification?: Record<string, unknown>;
    WebViewJavascriptBridge?: Record<string, unknown>;
  }
}

const BRIDGE_NAMES = [
  "SrkAdmin",
  "Android",
  "AndroidBridge",
  "AndroidNotification",
] as const;

/** Common AI Studio / WebView token getter names (Android interfaces often aren't enumerable). */
const TOKEN_METHODS = [
  "getFcmToken",
  "getFCMToken",
  "getFirebaseToken",
  "getFirebaseMessagingToken",
  "getPushToken",
  "getPushNotificationToken",
  "getNotificationToken",
  "getDeviceToken",
  "getDeviceId",
  "getToken",
  "readToken",
  "fetchToken",
  "requestToken",
  "fcmToken",
  "token",
];

const TOKEN_PROPS = [
  "fcmToken",
  "FCMToken",
  "firebaseToken",
  "pushToken",
  "deviceToken",
  "token",
];

function looksLikeFcmToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const t = value.trim();
  // FCM tokens are long opaque strings (typically 100+ chars)
  return t.length >= 80 && !/\s/.test(t) && !t.startsWith("http");
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

function getBridge(name: (typeof BRIDGE_NAMES)[number]): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const value = window[name];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function callMaybeToken(obj: Record<string, unknown>, method: string): string | null {
  const fn = obj[method];
  if (typeof fn !== "function") return null;
  try {
    const value = (fn as TokenGetter).call(obj);
    if (looksLikeFcmToken(value)) return value.trim();
    // Some bridges return Promise
    if (value && typeof value === "object" && "then" in (value as object)) {
      return null; // handled async elsewhere if needed
    }
  } catch {
    /* method missing or requires args */
  }
  return null;
}

function readPropToken(obj: Record<string, unknown>, prop: string): string | null {
  try {
    const value = obj[prop];
    if (looksLikeFcmToken(value)) return value.trim();
  } catch {
    /* ignore */
  }
  return null;
}

/** Probe common WebView JS bridges + globals for an FCM token. */
export function readBridgeToken(): string | null {
  if (typeof window === "undefined") return null;

  const fromGlobal = window.__SRK_FCM_TOKEN__?.trim();
  if (looksLikeFcmToken(fromGlobal)) return fromGlobal!;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("fcm_token")?.trim() || params.get("fcmToken")?.trim();
  if (looksLikeFcmToken(fromQuery)) return fromQuery!;

  for (const name of BRIDGE_NAMES) {
    const bridge = getBridge(name);
    if (!bridge) continue;
    for (const prop of TOKEN_PROPS) {
      const token = readPropToken(bridge, prop);
      if (token) return token;
    }
    for (const method of TOKEN_METHODS) {
      const token = callMaybeToken(bridge, method);
      if (token) return token;
    }
  }

  return null;
}

export type BridgeProbe = {
  hasToken: boolean;
  tokenPreview: string | null;
  bridgesFound: string[];
  /** Methods/props that exist on the bridges (for APK debugging). */
  bridgeMethods: string[];
  hint: string;
};

/** Probe which bridge methods are callable (Android JS interfaces often aren't in Object.keys). */
export function describePushBridge(): BridgeProbe {
  if (typeof window === "undefined") {
    return {
      hasToken: false,
      tokenPreview: null,
      bridgesFound: [],
      bridgeMethods: [],
      hint: "",
    };
  }

  const bridgesFound: string[] = [];
  const bridgeMethods: string[] = [];

  for (const name of BRIDGE_NAMES) {
    const bridge = getBridge(name);
    if (!bridge) continue;
    bridgesFound.push(name);

    for (const method of [
      ...TOKEN_METHODS,
      "showNotification",
      "showToast",
      "postMessage",
      "openUrl",
      "vibrate",
    ]) {
      try {
        if (typeof bridge[method] === "function") {
          bridgeMethods.push(`${name}.${method}()`);
        }
      } catch {
        /* ignore */
      }
    }
    for (const prop of TOKEN_PROPS) {
      try {
        if (typeof bridge[prop] === "string") {
          bridgeMethods.push(`${name}.${prop}`);
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (window.__SRK_FCM_TOKEN__) bridgesFound.push("__SRK_FCM_TOKEN__");

  const token = readBridgeToken();
  const hasShowOnly =
    bridgeMethods.some((m) => m.endsWith(".showNotification()")) &&
    !bridgeMethods.some((m) => /getFcm|getToken|readToken|fcmToken/i.test(m));

  let hint = "";
  if (token) {
    hint = "Token found — tap Register this device.";
  } else if (hasShowOnly) {
    hint =
      "APK only has showNotification (local alerts while app is open). Add getFcmToken() on AndroidNotification for real push when app is closed.";
  } else if (bridgesFound.length > 0) {
    hint =
      "Bridge present but no token getter. In AI Studio, add @JavascriptInterface getFcmToken() that returns the FCM token.";
  } else {
    hint = "No Android bridge detected.";
  }

  return {
    hasToken: Boolean(token),
    tokenPreview: token ? `${token.slice(0, 12)}…${token.slice(-8)}` : null,
    bridgesFound,
    bridgeMethods,
    hint,
  };
}

/**
 * Registers the admin WebView APK FCM token with the server after login.
 * Android must expose a token getter or inject window.__SRK_FCM_TOKEN__.
 */
export function AdminPushRegistrar() {
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    const apply = (token: string | null | undefined) => {
      if (!token?.trim() || token === lastToken.current) return;
      if (!looksLikeFcmToken(token)) return;
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
