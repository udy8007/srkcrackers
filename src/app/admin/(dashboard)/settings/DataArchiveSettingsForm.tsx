"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ArchiveFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

interface ArchiveLogEntry {
  id: string;
  filename: string;
  sizeBytes: number;
  status: string;
  trigger: string;
  recipient: string;
  error: string | null;
  createdAt: string;
}

interface ArchiveSettingsData {
  enabled: boolean;
  emailExportEnabled: boolean;
  frequency: ArchiveFrequency;
  recipientEmail: string;
  runHour: number;
  runDayOfWeek: number;
  runDayOfMonth: number;
  cronExpression: string;
  retentionMonths: number;
  includeSiteVisits: boolean;
  includeErrorLogs: boolean;
  includeAuditLogs: boolean;
  includeNotificationLog: boolean;
  lastArchiveAt: string | null;
  lastArchiveStatus: string | null;
  lastArchiveError: string | null;
  cutoffLabel: string;
  adminNotifyEmail: string;
  recentLogs: ArchiveLogEntry[];
}

const DEFAULTS: ArchiveSettingsData = {
  enabled: false,
  emailExportEnabled: true,
  frequency: "MONTHLY",
  recipientEmail: "",
  runHour: 2,
  runDayOfWeek: 0,
  runDayOfMonth: 1,
  cronExpression: "0 2 1 * *",
  retentionMonths: 2,
  includeSiteVisits: true,
  includeErrorLogs: true,
  includeAuditLogs: true,
  includeNotificationLog: true,
  lastArchiveAt: null,
  lastArchiveStatus: null,
  lastArchiveError: null,
  cutoffLabel: "",
  adminNotifyEmail: "",
  recentLogs: [],
};

const RETENTION_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

const CRON_PRESETS = [
  { id: "monthly", label: "Monthly once", cron: "0 2 1 * *", frequency: "MONTHLY" as const, hour: 2, dow: 0, dom: 1 },
  { id: "daily2", label: "Daily 2:00 AM", cron: "0 2 * * *", frequency: "DAILY" as const, hour: 2, dow: 0, dom: 1 },
  { id: "daily8", label: "Daily 8:00 AM", cron: "0 8 * * *", frequency: "DAILY" as const, hour: 8, dow: 0, dom: 1 },
  { id: "sun2", label: "Sunday 2:00 AM", cron: "0 2 * * 0", frequency: "WEEKLY" as const, hour: 2, dow: 0, dom: 1 },
  { id: "every8h", label: "Every 8 hours", cron: "0 */8 * * *", frequency: "DAILY" as const, hour: 2, dow: 0, dom: 1 },
];

const ENTITIES = [
  {
    key: "includeSiteVisits" as const,
    title: "Page visits",
    subtitle: "Shop and checkout visit tracking",
  },
  {
    key: "includeErrorLogs" as const,
    title: "Error logs",
    subtitle: "API and application errors",
  },
  {
    key: "includeAuditLogs" as const,
    title: "Audit logs",
    subtitle: "Admin action history",
  },
  {
    key: "includeNotificationLog" as const,
    title: "Notification log",
    subtitle: "Sent email and push records",
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function buildCron(frequency: ArchiveFrequency, hour: number, dow: number, dom: number) {
  switch (frequency) {
    case "DAILY":
      return `0 ${hour} * * *`;
    case "WEEKLY":
      return `0 ${hour} * * ${dow}`;
    case "MONTHLY":
      return `0 ${hour} ${dom} * *`;
    default:
      return `0 ${hour} 1 * *`;
  }
}

function frequencyHint(frequency: ArchiveFrequency, hour: number, dom: number) {
  const h = hour % 12 || 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  switch (frequency) {
    case "DAILY":
      return `Once a day at ${h}:00 ${ampm} (IST).`;
    case "WEEKLY":
      return `Once a week — Sunday at ${h}:00 ${ampm} (IST).`;
    case "MONTHLY":
      return `Once a month — ${dom}${dom === 1 ? "st" : dom === 2 ? "nd" : dom === 3 ? "rd" : "th"} of the month at ${h}:00 ${ampm} (IST).`;
    default:
      return "";
  }
}

export function DataArchiveSettingsForm() {
  const [form, setForm] = useState<ArchiveSettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [runResult, setRunResult] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"scheduled" | "email">("scheduled");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/archive");
      if (res.ok) {
        const data = (await res.json()) as ArchiveSettingsData;
        setForm({ ...DEFAULTS, ...data });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof ArchiveSettingsData>(key: K, value: ArchiveSettingsData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (
        key === "frequency" ||
        key === "runHour" ||
        key === "runDayOfWeek" ||
        key === "runDayOfMonth"
      ) {
        next.cronExpression = buildCron(
          key === "frequency" ? (value as ArchiveFrequency) : next.frequency,
          key === "runHour" ? (value as number) : next.runHour,
          key === "runDayOfWeek" ? (value as number) : next.runDayOfWeek,
          key === "runDayOfMonth" ? (value as number) : next.runDayOfMonth,
        );
      }
      return next;
    });
  };

  const applyPreset = (preset: (typeof CRON_PRESETS)[number]) => {
    setForm((prev) => ({
      ...prev,
      frequency: preset.frequency,
      runHour: preset.hour,
      runDayOfWeek: preset.dow,
      runDayOfMonth: preset.dom,
      cronExpression: preset.cron,
    }));
  };

  const cronPreview = useMemo(() => {
    const parts = form.cronExpression.trim().split(/\s+/);
    if (parts.length >= 5) {
      return `CRON # ${parts.slice(1).join(" ")} · Asia/Kolkata`;
    }
    return `CRON # ${form.cronExpression} · Asia/Kolkata`;
  }, [form.cronExpression]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/archive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          emailExportEnabled: form.emailExportEnabled,
          frequency: form.frequency,
          recipientEmail: form.recipientEmail,
          runHour: form.runHour,
          runDayOfWeek: form.runDayOfWeek,
          runDayOfMonth: form.runDayOfMonth,
          cronExpression: form.cronExpression,
          retentionMonths: form.retentionMonths,
          includeSiteVisits: form.includeSiteVisits,
          includeErrorLogs: form.includeErrorLogs,
          includeAuditLogs: form.includeAuditLogs,
          includeNotificationLog: form.includeNotificationLog,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save archive settings");
        return;
      }
      setForm((prev) => ({ ...prev, ...data }));
      setSuccess("Archive schedule saved.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveNow = async () => {
    if (!form.emailExportEnabled) {
      setRunResult("Enable email export first.");
      return;
    }
    if (!confirm("Export old records by email and remove them from the database?")) return;

    setRunResult("");
    setRunning(true);
    try {
      const res = await fetch("/api/admin/settings/archive/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRunResult(`Failed: ${data.error ?? "Unknown error"}`);
        return;
      }
      const total = data.recordCounts
        ? Object.values(data.recordCounts as Record<string, number>).reduce((a, b) => a + b, 0)
        : 0;
      setRunResult(
        data.filename
          ? `Archive sent: ${data.filename} (${formatBytes(data.sizeBytes)}) — ${total} rows`
          : `No records to archive (nothing older than retention cutoff).`,
      );
      void load();
    } catch {
      setRunResult("Network error during archive.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading data archive settings…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Data archive</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Export old visits, error logs, and audit logs by email, then remove them from the database.
          Keeps recent months based on your retention setting.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-ink">Trim large log tables</h3>
              <label className="flex items-center gap-2 rounded-lg bg-brandbg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => update("enabled", e.target.checked)}
                  className="h-4 w-4 accent-primary-dark"
                />
                {form.enabled ? "Enabled" : "Disabled"}
              </label>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScheduleMode("scheduled")}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  scheduleMode === "scheduled"
                    ? "border-primary-dark bg-primary-dark/5"
                    : "border-line bg-white hover:border-primary/30"
                }`}
              >
                <span className="block text-sm font-bold text-ink">Scheduled archive</span>
                <span className="mt-1 block text-xs text-ink-muted">
                  When on, old records are exported and removed when the cron matches IST.
                </span>
              </button>

              <div
                className={`rounded-xl border-2 p-4 transition ${
                  scheduleMode === "email"
                    ? "border-primary-dark bg-primary-dark/5"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setScheduleMode("email")} className="text-left">
                    <span className="block text-sm font-bold text-ink">Email export</span>
                    <span className="mt-1 block text-xs text-ink-muted">
                      Required for Archive now and for the schedule.
                    </span>
                  </button>
                  <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                    <input
                      type="checkbox"
                      checked={form.emailExportEnabled}
                      onChange={(e) => update("emailExportEnabled", e.target.checked)}
                      className="h-3.5 w-3.5 accent-primary-dark"
                    />
                    {form.emailExportEnabled ? "On" : "Off"}
                  </label>
                </div>
              </div>
            </div>

            <label className="mb-5 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Send to email
              </span>
              <input
                type="email"
                className="input"
                value={form.recipientEmail}
                onChange={(e) => update("recipientEmail", e.target.value)}
                placeholder="admin@example.com"
              />
              {form.adminNotifyEmail && (
                <span className="mt-1 block text-xs text-ink-muted">
                  Saved only for data archives. Overrides the admin email in Notification configure (
                  {form.adminNotifyEmail}).
                </span>
              )}
            </label>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Entities to archive
            </p>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {ENTITIES.map((entity) => {
                const selected = form[entity.key];
                return (
                  <button
                    key={entity.key}
                    type="button"
                    onClick={() => update(entity.key, !selected)}
                    className={`rounded-xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-primary-dark bg-primary-dark text-white"
                        : "border-line bg-white hover:border-primary/30"
                    }`}
                  >
                    <span className="block text-sm font-bold">{entity.title}</span>
                    <span
                      className={`mt-0.5 block text-xs ${selected ? "text-white/80" : "text-ink-muted"}`}
                    >
                      {entity.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="mb-5 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Months to retain
              </span>
              <select
                className="input max-w-xs"
                value={form.retentionMonths}
                onChange={(e) => update("retentionMonths", Number(e.target.value))}
              >
                {RETENTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-ink-muted">
                Records from the last {form.retentionMonths} calendar month
                {form.retentionMonths === 1 ? "" : "s"} stay in the database. Older rows are exported
                then deleted.
                {form.cutoffLabel && (
                  <>
                    {" "}
                    Cutoff: before {form.cutoffLabel} IST.
                  </>
                )}
              </span>
            </label>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Repeat frequency
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {(["DAILY", "WEEKLY", "MONTHLY"] as ArchiveFrequency[]).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => update("frequency", freq)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                    form.frequency === freq
                      ? "border-primary-dark bg-primary-dark text-white"
                      : "border-line bg-white text-ink hover:border-primary/30"
                  }`}
                >
                  {freq.toLowerCase()}
                </button>
              ))}
            </div>
            <p className="mb-4 text-xs text-ink-muted">
              {frequencyHint(form.frequency, form.runHour, form.runDayOfMonth)}
            </p>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Time presets
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    form.cronExpression === preset.cron
                      ? "border-primary-dark bg-primary-dark text-white"
                      : "border-line bg-white text-ink hover:border-primary/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="mb-2 block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Cron expression
              </span>
              <input
                type="text"
                className="input font-mono text-sm"
                value={form.cronExpression}
                onChange={(e) => update("cronExpression", e.target.value)}
                placeholder="0 2 1 * *"
              />
            </label>
            <p className="mb-5 rounded-lg bg-primary-dark px-3 py-2 font-mono text-xs text-white">
              {cronPreview}
            </p>

            {form.lastArchiveAt && (
              <div className="mb-4 rounded-lg border border-line px-4 py-3 text-sm">
                <p>
                  <strong>Last archive:</strong>{" "}
                  {new Date(form.lastArchiveAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{" "}
                  IST
                </p>
                <p className="text-ink-muted">
                  Status: {form.lastArchiveStatus}
                  {form.lastArchiveError && ` — ${form.lastArchiveError}`}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Saving…" : "Save schedule"}
              </button>
              <button
                type="button"
                onClick={handleArchiveNow}
                disabled={running || !form.emailExportEnabled}
                className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
              >
                {running ? "Archiving…" : "Archive now"}
              </button>
            </div>
            {runResult && (
              <p
                className={`mt-2 text-sm ${runResult.startsWith("Failed") ? "text-red" : "text-green"}`}
              >
                {runResult}
              </p>
            )}
          </div>

          {form.recentLogs.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
              <h3 className="font-display text-base font-semibold text-ink">Recent archives</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">File</th>
                      <th className="py-2 pr-3">Size</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-line/60">
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </td>
                        <td className="py-2 pr-3 font-mono">{log.filename}</td>
                        <td className="py-2 pr-3">{formatBytes(log.sizeBytes)}</td>
                        <td
                          className={`py-2 pr-3 ${log.status === "SENT" ? "text-green" : "text-red"}`}
                        >
                          {log.status}
                        </td>
                        <td className="py-2">{log.trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p className="rounded-lg bg-red/10 p-2.5 text-sm text-red">{error}</p>}
          {success && <p className="rounded-lg bg-green/10 p-2.5 text-sm text-green">{success}</p>}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-white p-5 shadow-sm">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
            How it works
          </h3>
          <ul className="mt-4 space-y-4 text-sm text-ink-muted">
            <li>
              <strong className="text-ink">Pick entities</strong>
              <p className="mt-0.5">Choose which log tables to target for export and cleanup.</p>
            </li>
            <li>
              <strong className="text-ink">Set retention</strong>
              <p className="mt-0.5">
                The default keeps the current month. Increasing retention keeps more history in-app.
              </p>
            </li>
            <li>
              <strong className="text-ink">Email then delete</strong>
              <p className="mt-0.5">
                Old rows are attached as JSON + SQL, emailed, then removed from the database.
              </p>
            </li>
            <li>
              <strong className="text-ink">System note</strong>
              <p className="mt-0.5">Runs with the in-app scheduler while the backoffice is open.</p>
            </li>
          </ul>
        </aside>
      </form>
    </div>
  );
}
