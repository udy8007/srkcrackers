"use client";

import { useCallback, useEffect, useState } from "react";
import {
  describePushBridge,
  registerAdminFcmToken,
} from "@/components/admin/AdminPushRegistrar";

export function PushTestForm() {
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [bridge, setBridge] = useState(() => ({
    hasToken: false,
    tokenPreview: null as string | null,
    bridgesFound: [] as string[],
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
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Test push failed");
        if (typeof data.deviceCount === "number") setDeviceCount(data.deviceCount);
        return;
      }
      setMessage(data.message ?? `Sent to ${data.sent} device(s)`);
      if (typeof data.deviceCount === "number") setDeviceCount(data.deviceCount);
      await refreshStatus();
    } catch {
      setError("Network error while sending test push");
    } finally {
      setLoading(false);
    }
  };

  const registerManual = async () => {
    setRegistering(true);
    setMessage(null);
    setError(null);
    const result = await registerAdminFcmToken(manualToken);
    setRegistering(false);
    if (!result.ok) {
      setError(result.error ?? "Could not register token");
      return;
    }
    setMessage("Token registered. Registered devices should increase after refresh.");
    setManualToken("");
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
            {configured == null ? "…" : configured ? "Configured" : "Not configured"}
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
                ? `Bridge found (${bridge.bridgesFound.join(", ")}) but no token method`
                : "No Android FCM bridge detected — APK is not injecting a token"}
          </dd>
        </div>
      </dl>

      <div className="mb-4 space-y-2">
        <label className="block text-xs font-semibold text-ink">
          Manual FCM token (optional test)
        </label>
        <textarea
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          rows={3}
          placeholder="Paste device FCM token from Android Logcat / Firebase…"
          className="input font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => void registerManual()}
          disabled={registering || !manualToken.trim()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {registering ? "Registering…" : "Register this token"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send test push"}
        </button>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          Refresh status
        </button>
      </div>

      {message && <p className="mt-3 text-sm font-medium text-green">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}
    </section>
  );
}
