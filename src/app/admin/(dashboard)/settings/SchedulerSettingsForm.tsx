"use client";

import { useCallback, useEffect, useState } from "react";

interface SchedulerData {
  enabled: boolean;
  tickIntervalMinutes: number;
  lastTickAt: string | null;
  lastDeliverAt: string | null;
  lastReminderAt: string | null;
}

const DEFAULTS: SchedulerData = {
  enabled: true,
  tickIntervalMinutes: 30,
  lastTickAt: null,
  lastDeliverAt: null,
  lastReminderAt: null,
};

export function SchedulerSettingsForm() {
  const [form, setForm] = useState<SchedulerData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [runResult, setRunResult] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scheduler");
      if (res.ok) setForm(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/scheduler", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          tickIntervalMinutes: form.tickIntervalMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setForm(data);
      setSuccess("Scheduler settings saved.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunResult("");
    setRunning(true);
    try {
      const res = await fetch("/api/admin/scheduler", { method: "POST" });
      const data = await res.json();
      if (data.skipped) {
        setRunResult("Skipped — ran recently (5 min debounce).");
      } else {
        setRunResult(
          `Done — delivered: ${data.delivered ?? 0}, reminders: ${data.reminded ?? 0}, backup: ${data.backup?.ran ? "checked" : "n/a"}`,
        );
      }
      void load();
    } catch {
      setRunResult("Network error.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading scheduler…</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">In-App Scheduler</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Runs reminders, auto-deliver, and backup checks from code — no Vercel Pro cron needed.
              Triggers while admin portal is open, on dashboard load, and customer track-order visits.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-brandbg px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            {form.enabled ? "Scheduler on" : "Scheduler off"}
          </label>
        </div>

        <label className="block max-w-xs">
          <span className="mb-1 block text-xs font-semibold text-ink">
            Admin portal poll interval (minutes)
          </span>
          <input
            type="number"
            min={5}
            max={1440}
            className="input"
            value={form.tickIntervalMinutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, tickIntervalMinutes: Number(e.target.value) }))
            }
          />
          <span className="mt-1 block text-xs text-ink-muted">
            How often the admin dashboard checks for due jobs (5–1440 min).
          </span>
        </label>

        {(form.lastTickAt || form.lastReminderAt) && (
          <div className="mt-4 rounded-lg border border-line px-4 py-3 text-xs text-ink-muted">
            {form.lastTickAt && (
              <p>Last tick: {new Date(form.lastTickAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
            )}
            {form.lastReminderAt && (
              <p>Last reminder run: {new Date(form.lastReminderAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
            )}
            {form.lastDeliverAt && (
              <p>Last auto-deliver: {new Date(form.lastDeliverAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleRunNow}
          disabled={running}
          className="mt-4 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
        >
          {running ? "Running…" : "Run scheduler now"}
        </button>
        {runResult && (
          <p className={`mt-2 text-sm ${runResult.startsWith("Skipped") ? "text-ink-muted" : "text-green"}`}>
            {runResult}
          </p>
        )}
      </div>

      {error && <p className="rounded-lg bg-red/10 p-2.5 text-sm text-red">{error}</p>}
      {success && <p className="rounded-lg bg-green/10 p-2.5 text-sm text-green">{success}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? "Saving…" : "Save scheduler settings"}
      </button>
    </form>
  );
}
