"use client";

import { useCallback, useEffect, useState } from "react";

type BackupFrequency = "DAILY" | "MONTHLY" | "YEARLY";

interface BackupLogEntry {
  id: string;
  filename: string;
  sizeBytes: number;
  status: string;
  trigger: string;
  recipient: string;
  error: string | null;
  createdAt: string;
}

interface BackupSettingsData {
  enabled: boolean;
  frequency: BackupFrequency;
  recipientEmail: string;
  runHour: number;
  runDayOfMonth: number;
  runMonth: number;
  runDayOfYear: number;
  includeScreenshots: boolean;
  lastBackupAt: string | null;
  lastBackupStatus: string | null;
  lastBackupError: string | null;
  recentLogs: BackupLogEntry[];
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DEFAULTS: BackupSettingsData = {
  enabled: false,
  frequency: "DAILY",
  recipientEmail: "",
  runHour: 2,
  runDayOfMonth: 1,
  runMonth: 1,
  runDayOfYear: 1,
  includeScreenshots: false,
  lastBackupAt: null,
  lastBackupStatus: null,
  lastBackupError: null,
  recentLogs: [],
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function BackupSettingsForm() {
  const [form, setForm] = useState<BackupSettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [runResult, setRunResult] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/backup");
      if (res.ok) {
        const data = (await res.json()) as BackupSettingsData;
        setForm(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof BackupSettingsData>(key: K, value: BackupSettingsData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/backup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          frequency: form.frequency,
          recipientEmail: form.recipientEmail,
          runHour: form.runHour,
          runDayOfMonth: form.runDayOfMonth,
          runMonth: form.runMonth,
          runDayOfYear: form.runDayOfYear,
          includeScreenshots: form.includeScreenshots,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save backup settings");
        return;
      }
      setForm((prev) => ({ ...prev, ...data }));
      setSuccess("Backup settings saved.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunResult("");
    setRunning(true);
    try {
      const res = await fetch("/api/admin/settings/backup/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRunResult(`Failed: ${data.error ?? "Unknown error"}`);
        return;
      }
      setRunResult(`Backup sent: ${data.filename} (${formatBytes(data.sizeBytes)})`);
      void load();
    } catch {
      setRunResult("Network error during backup.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading backup settings…</p>;
  }

  const scheduleHint =
    form.frequency === "DAILY"
      ? `Every day at ${String(form.runHour).padStart(2, "0")}:00 IST`
      : form.frequency === "MONTHLY"
        ? `Day ${form.runDayOfMonth} of each month at ${String(form.runHour).padStart(2, "0")}:00 IST`
        : `${form.runDayOfYear} ${MONTHS[form.runMonth - 1]} each year at ${String(form.runHour).padStart(2, "0")}:00 IST`;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Database Backup</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Full database export emailed on a schedule (daily, monthly, or yearly).
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-brandbg px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            {form.enabled ? "Scheduled backup on" : "Scheduled backup off"}
          </label>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-semibold text-ink">Backup recipient email</span>
          <input
            type="email"
            className="input"
            value={form.recipientEmail}
            onChange={(e) => update("recipientEmail", e.target.value)}
            placeholder="admin@srkcrackers.in"
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Compressed .json.gz backup file is sent to this address. SMTP must be configured above.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Frequency</span>
            <select
              className="input"
              value={form.frequency}
              onChange={(e) => update("frequency", e.target.value as BackupFrequency)}
            >
              <option value="DAILY">Daily</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Run at hour (IST, 0–23)</span>
            <input
              type="number"
              min={0}
              max={23}
              className="input"
              value={form.runHour}
              onChange={(e) => update("runHour", Number(e.target.value))}
            />
          </label>

          {form.frequency === "MONTHLY" && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink">Day of month (1–28)</span>
              <input
                type="number"
                min={1}
                max={28}
                className="input"
                value={form.runDayOfMonth}
                onChange={(e) => update("runDayOfMonth", Number(e.target.value))}
              />
            </label>
          )}

          {form.frequency === "YEARLY" && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Month</span>
                <select
                  className="input"
                  value={form.runMonth}
                  onChange={(e) => update("runMonth", Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink">Day (1–28)</span>
                <input
                  type="number"
                  min={1}
                  max={28}
                  className="input"
                  value={form.runDayOfYear}
                  onChange={(e) => update("runDayOfYear", Number(e.target.value))}
                />
              </label>
            </>
          )}
        </div>

        <p className="mt-3 rounded-lg bg-brandbg px-3 py-2 text-xs text-ink-muted">
          Schedule: <strong className="text-ink">{scheduleHint}</strong>
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3">
          <input
            type="checkbox"
            checked={form.includeScreenshots}
            onChange={(e) => update("includeScreenshots", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <div>
            <span className="block text-sm font-semibold text-ink">Include payment screenshots</span>
            <span className="text-xs text-ink-muted">
              Off by default — screenshots make backups much larger and may exceed email limits.
            </span>
          </div>
        </label>

        {form.lastBackupAt && (
          <div className="mt-4 rounded-lg border border-line px-4 py-3 text-sm">
            <p>
              <strong>Last backup:</strong>{" "}
              {new Date(form.lastBackupAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
            </p>
            <p className="text-ink-muted">
              Status: {form.lastBackupStatus}
              {form.lastBackupError && ` — ${form.lastBackupError}`}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRunNow}
            disabled={running}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
          >
            {running ? "Creating backup…" : "Backup now (manual)"}
          </button>
        </div>
        {runResult && (
          <p className={`mt-2 text-sm ${runResult.startsWith("Failed") ? "text-red" : "text-green"}`}>
            {runResult}
          </p>
        )}
      </div>

      {form.recentLogs.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold text-ink">Recent backups</h3>
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
                      {new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="py-2 pr-3 font-mono">{log.filename}</td>
                    <td className="py-2 pr-3">{formatBytes(log.sizeBytes)}</td>
                    <td className={`py-2 pr-3 ${log.status === "SENT" ? "text-green" : "text-red"}`}>
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

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? "Saving…" : "Save backup settings"}
      </button>
    </form>
  );
}
