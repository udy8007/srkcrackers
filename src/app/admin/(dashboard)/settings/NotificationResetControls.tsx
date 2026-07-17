"use client";

import Link from "next/link";
import { useState } from "react";

export function NotificationResetControls() {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");

  const resetAll = async () => {
    if (!confirm("Clear all email, push, and in-app notification logs?")) return;
    setMessage("");
    setResetting(true);
    try {
      const [emailRes, inAppRes, pushRes] = await Promise.all([
        fetch("/api/admin/settings/email/logs", { method: "DELETE" }),
        fetch("/api/admin/notifications", { method: "DELETE" }),
        fetch("/api/admin/push/logs", { method: "DELETE" }),
      ]);

      if (!emailRes.ok || !inAppRes.ok || !pushRes.ok) {
        setMessage("Could not clear all logs. Try again.");
        return;
      }

      const [email, inApp, push] = await Promise.all([
        emailRes.json(),
        inAppRes.json(),
        pushRes.json(),
      ]);

      setMessage(
        `Reset complete — email ${email.deleted ?? 0}, push ${push.deleted ?? 0}, bell ${inApp.deleted ?? 0}.`,
      );
    } catch {
      setMessage("Network error while resetting logs.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Notification Logs</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Full history is on the{" "}
            <Link href="/admin/notifications" className="font-medium text-primary hover:underline">
              Notifications
            </Link>{" "}
            page. Reset clears email, push, and in-app logs from the database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void resetAll()}
          disabled={resetting}
          className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-semibold text-red transition hover:bg-red/5 disabled:opacity-50"
        >
          {resetting ? "Clearing…" : "Reset logs"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.includes("error") || message.includes("Could not") ? "text-red" : "text-green"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
