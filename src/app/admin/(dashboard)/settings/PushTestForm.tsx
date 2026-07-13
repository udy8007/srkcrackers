"use client";

import { useCallback, useEffect, useState } from "react";

export function PushTestForm() {
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

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

  return (
    <section className="max-w-xl rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Push notifications (APK)</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Sends a Firebase test notification to registered admin APK devices. Open the APK and sign in
        once so the FCM token is saved.
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
      </dl>

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
