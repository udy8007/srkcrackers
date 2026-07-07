"use client";

import { useCallback, useEffect, useState } from "react";

interface EmailLogEntry {
  id: string;
  orderId: string | null;
  trigger: string;
  recipient: string;
  subject: string;
  status: string;
  error: string | null;
  createdAt: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_PLACED_CUSTOMER: "New order (customer)",
  ORDER_PLACED_ADMIN: "New order (admin)",
  STATUS_CHANGE_CUSTOMER: "Status change (customer)",
  STATUS_CHANGE_ADMIN: "Status change (admin)",
  DELIVERED_CUSTOMER: "Delivered (customer)",
  PENDING_REMINDER_ADMIN: "Pending reminder",
  DB_BACKUP: "DB backup",
  TEST: "Test",
};

function triggerLabel(trigger: string) {
  return TRIGGER_LABELS[trigger] ?? trigger;
}

export function EmailNotificationLog() {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<"email" | "inapp" | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/email/logs?limit=50");
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetEmailLog = async () => {
    if (!confirm("Clear all email notification log entries from the database?")) return;
    setMessage("");
    setResetting("email");
    try {
      const res = await fetch("/api/admin/settings/email/logs", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not clear email log");
        return;
      }
      setMessage(`Cleared ${data.deleted ?? 0} email log entries.`);
      await load();
    } catch {
      setMessage("Network error while clearing email log.");
    } finally {
      setResetting(null);
    }
  };

  const resetInAppNotifications = async () => {
    if (!confirm("Clear all in-app bell notifications from the database?")) return;
    setMessage("");
    setResetting("inapp");
    try {
      const res = await fetch("/api/admin/notifications", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not clear notifications");
        return;
      }
      setMessage(`Cleared ${data.deleted ?? 0} in-app notifications.`);
    } catch {
      setMessage("Network error while clearing notifications.");
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Notification Log</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Database record of every outbound email ({total} total). Use this to verify order alerts were sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-brandbg disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void resetEmailLog()}
            disabled={resetting !== null || total === 0}
            className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-semibold text-red transition hover:bg-red/5 disabled:opacity-50"
          >
            {resetting === "email" ? "Clearing…" : "Reset email log"}
          </button>
          <button
            type="button"
            onClick={() => void resetInAppNotifications()}
            disabled={resetting !== null}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-brandbg disabled:opacity-50"
          >
            {resetting === "inapp" ? "Clearing…" : "Reset bell notifications"}
          </button>
        </div>
      </div>

      {message && (
        <p className={`mb-3 text-sm ${message.includes("error") || message.includes("Could not") ? "text-red" : "text-green"}`}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading log…</p>
      ) : logs.length === 0 ? (
        <p className="rounded-lg bg-brandbg px-4 py-6 text-center text-sm text-ink-muted">
          No emails logged yet. Place a test order with notifications enabled to see entries here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Trigger</th>
                <th className="py-2 pr-3">Recipient</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </td>
                  <td className="py-2 pr-3">{triggerLabel(log.trigger)}</td>
                  <td className="py-2 pr-3">{log.recipient}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate" title={log.subject}>
                    {log.subject}
                  </td>
                  <td className={`py-2 ${log.status === "SENT" ? "text-green" : "text-red"}`}>
                    {log.status}
                    {log.error && (
                      <span className="mt-0.5 block text-[0.65rem] text-red" title={log.error}>
                        {log.error}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
