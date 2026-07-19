"use client";

import { useCallback, useEffect, useState } from "react";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

interface ReportEmailSettingsData {
  enabled: boolean;
  frequency: Frequency;
  recipientEmail: string;
  runHour: number;
  runDayOfWeek: number;
  runDayOfMonth: number;
  includeSales: boolean;
  includeOrders: boolean;
  includeCatalog: boolean;
  includeTraffic: boolean;
  notifyPush: boolean;
  lastSentAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULTS: ReportEmailSettingsData = {
  enabled: false,
  frequency: "DAILY",
  recipientEmail: "",
  runHour: 8,
  runDayOfWeek: 1,
  runDayOfMonth: 1,
  includeSales: true,
  includeOrders: true,
  includeCatalog: true,
  includeTraffic: true,
  notifyPush: true,
  lastSentAt: null,
  lastStatus: null,
  lastError: null,
};

function formatWhen(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ReportEmailSettingsForm({ compact }: { compact?: boolean }) {
  const [form, setForm] = useState<ReportEmailSettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/report-email");
      if (res.ok) {
        const data = (await res.json()) as ReportEmailSettingsData;
        setForm({ ...DEFAULTS, ...data });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof ReportEmailSettingsData>(
    key: K,
    value: ReportEmailSettingsData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings/report-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      setForm({ ...DEFAULTS, ...data });
      setSuccess("Email report settings saved.");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const sendNow = async () => {
    if (!confirm("Send a business report email now to the configured recipient?")) return;
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings/report-email/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send report.");
        await load();
        return;
      }
      setSuccess(data.message ?? "Report sent.");
      await load();
    } catch {
      setError("Network error while sending.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 text-sm text-ink-muted shadow-sm">
        Loading email report settings…
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-line bg-white shadow-sm ${compact ? "p-5" : "p-5"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Email report settings</h2>
          <p className="mt-1 text-sm text-ink-muted">
            When enabled, a summary report is emailed to the admin address on your schedule (IST).
            Requires SMTP enabled in Settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => update("enabled", !form.enabled)}
          className={`relative h-7 w-12 rounded-full transition ${
            form.enabled ? "bg-green" : "bg-line"
          }`}
          title={form.enabled ? "Enabled" : "Disabled"}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
              form.enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs sm:col-span-2">
          <span className="mb-1 block font-semibold text-ink-muted">Recipient email *</span>
          <input
            type="email"
            className="input py-1.5"
            value={form.recipientEmail}
            onChange={(e) => update("recipientEmail", e.target.value)}
            placeholder="admin@example.com"
          />
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-semibold text-ink-muted">Frequency</span>
          <select
            className="input py-1.5"
            value={form.frequency}
            onChange={(e) => update("frequency", e.target.value as Frequency)}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block font-semibold text-ink-muted">Send time (IST hour)</span>
          <select
            className="input py-1.5"
            value={form.runHour}
            onChange={(e) => update("runHour", Number(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00 IST
              </option>
            ))}
          </select>
        </label>

        {form.frequency === "WEEKLY" && (
          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Day of week</span>
            <select
              className="input py-1.5"
              value={form.runDayOfWeek}
              onChange={(e) => update("runDayOfWeek", Number(e.target.value))}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}

        {form.frequency === "MONTHLY" && (
          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Day of month</span>
            <select
              className="input py-1.5"
              value={form.runDayOfMonth}
              onChange={(e) => update("runDayOfMonth", Number(e.target.value))}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Include in email
        </p>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["includeSales", "Sales"],
              ["includeOrders", "Orders"],
              ["includeCatalog", "Catalog"],
              ["includeTraffic", "Traffic"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
            >
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => update(key, e.target.checked)}
                className="h-3.5 w-3.5"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-brandbg/50 px-4 py-3">
        <input
          type="checkbox"
          checked={form.notifyPush}
          onChange={(e) => update("notifyPush", e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">FCM / in-app notification</span>
          <span className="mt-0.5 block text-xs text-ink-muted">
            When the report is sent, push to admin devices and show in the bell. Tap opens{" "}
            <strong>/admin/reports</strong>.
          </span>
        </span>
      </label>

      <div className="mt-4 rounded-xl bg-brandbg/80 px-4 py-3 text-xs text-ink-muted">
        <p>
          <span className="font-semibold text-ink">Last sent:</span> {formatWhen(form.lastSentAt)}
          {form.lastStatus ? ` · ${form.lastStatus}` : ""}
        </p>
        {form.lastError && <p className="mt-1 text-red">{form.lastError}</p>}
      </div>

      {error && <p className="mt-3 text-sm text-red">{error}</p>}
      {success && <p className="mt-3 text-sm text-green">{success}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button
          type="button"
          onClick={() => void sendNow()}
          disabled={sending}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send report now"}
        </button>
      </div>
    </section>
  );
}
