"use client";

import { useCallback, useEffect, useState } from "react";
import {
  describePushBridge,
  readBridgeToken,
  registerAdminFcmToken,
} from "@/components/admin/AdminPushRegistrar";

export function PushTestForm() {
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [bridge, setBridge] = useState(() => ({
    hasToken: false,
    tokenPreview: null as string | null,
    bridgesFound: [] as string[],
    bridgeMethods: [] as string[],
    hint: "",
  }));

  const refreshBridge = useCallback(() => {
    setBridge(describePushBridge());
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/push/test");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load push status");
        return;
      }
      setDeviceCount(data.deviceCount ?? 0);
      setConfigured(Boolean(data.configured));
      setProjectId(typeof data.projectId === "string" ? data.projectId : null);
      setError(null);
    } catch {
      setError("Network error while loading push status");
    } finally {
      refreshBridge();
    }
  }, [refreshBridge]);

  useEffect(() => {
    void refreshStatus();
    const id = window.setInterval(refreshBridge, 3000);
    return () => window.clearInterval(id);
  }, [refreshStatus, refreshBridge]);

  const sendTest = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const liveToken = readBridgeToken()?.trim() || manualToken.trim() || undefined;
      const res = await fetch("/api/admin/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liveToken ? { token: liveToken } : {}),
      });
      const data = await res.json();
      if (typeof data.deviceCount === "number") setDeviceCount(data.deviceCount);
      if (typeof data.projectId === "string") setProjectId(data.projectId);
      if (!res.ok || data.ok === false) {
        setError(data.error ?? "Test push failed");
        return;
      }
      setMessage(data.message ?? `Sent to ${data.sent} device(s)`);
      await refreshStatus();
    } catch {
      setError("Network error while sending test push");
    } finally {
      setLoading(false);
    }
  };

  const registerToken = async (source: "bridge" | "manual") => {
    setRegistering(true);
    setMessage(null);
    setError(null);
    refreshBridge();

    const token =
      source === "manual"
        ? manualToken.trim()
        : readBridgeToken()?.trim() || manualToken.trim();

    if (!token) {
      setRegistering(false);
      setError(
        source === "manual"
          ? "Paste an FCM token in the box first."
          : "No FCM token on this device yet. The APK must inject it, or paste a token below.",
      );
      return;
    }

    const result = await registerAdminFcmToken(token);
    setRegistering(false);
    if (!result.ok) {
      setError(result.error ?? "Could not register token");
      return;
    }
    setMessage("Token registered. Registered devices should increase after refresh.");
    if (source === "manual") setManualToken("");
    await refreshStatus();
  };

  return (
    <section className="max-w-xl rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Push notifications (APK)</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Opening the admin page alone does <strong>not</strong> create a token. The WebView APK must
        inject the FCM token into the page (or paste it below for a one-time test).
      </p>

      <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-brandbg px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Firebase server
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {configured == null
              ? "…"
              : configured
                ? projectId
                  ? `Configured (${projectId})`
                  : "Configured"
                : "Not configured"}
          </dd>
        </div>
        <div className="rounded-lg bg-brandbg px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Registered devices
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {deviceCount == null ? "…" : deviceCount}
          </dd>
        </div>
        <div className="rounded-lg bg-brandbg px-3 py-2 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            APK bridge on this device
          </dt>
          <dd className="mt-0.5 font-medium text-ink">
            {bridge.hasToken
              ? `Token detected (${bridge.tokenPreview})`
              : bridge.bridgesFound.length > 0
                ? `Bridges: ${bridge.bridgesFound.join(", ")}`
                : "No Android FCM bridge detected"}
          </dd>
          {bridge.bridgeMethods.length > 0 && (
            <dd className="mt-1 break-all font-mono text-[0.7rem] text-ink-muted">
              Methods: {bridge.bridgeMethods.join(", ")}
            </dd>
          )}
          {bridge.hint && (
            <dd className="mt-2 text-xs leading-relaxed text-ink-muted">{bridge.hint}</dd>
          )}
        </div>
      </dl>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void registerToken("bridge")}
          disabled={registering}
          className="btn-primary disabled:opacity-50"
        >
          {registering ? "Registering…" : "Register this device"}
        </button>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Refresh status
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <label className="block text-xs font-semibold text-ink">
          Or paste FCM token manually
        </label>
        <textarea
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          rows={3}
          placeholder="Paste device FCM token from Android Logcat / Firebase…"
          className="input min-h-[5rem] w-full font-mono text-xs"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void registerToken("manual")}
          disabled={registering}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {registering ? "Registering…" : "Register pasted token"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={loading}
          className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send test push"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm font-medium text-green">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}
    </section>
  );
}
