"use client";

import { useCallback, useEffect, useState } from "react";
import { NotificationTriggerCard } from "@/components/admin/NotificationTriggerCard";
import { NOTIFICATION_TRIGGER_META } from "@/lib/notification-trigger-meta";

interface EmailSettingsFormData {
  enabled: boolean;
  host: string;
  port: number;
  enableSsl: boolean;
  username: string;
  password: string;
  hasPassword: boolean;
  fromEmail: string;
  fromName: string;
  adminNotifyEmail: string;
  notifyCustomerOrderPlaced: boolean;
  notifyCustomerStatusChange: boolean;
  notifyCustomerDelivered: boolean;
  notifyAdminNewOrder: boolean;
  notifyAdminStatusChange: boolean;
  notifyAdminPendingReminder: boolean;
  pendingReminderHours: number;
}

const DEFAULTS: EmailSettingsFormData = {
  enabled: false,
  host: "",
  port: 465,
  enableSsl: true,
  username: "",
  password: "",
  hasPassword: false,
  fromEmail: "",
  fromName: "SRK Crackers",
  adminNotifyEmail: "",
  notifyCustomerOrderPlaced: true,
  notifyCustomerStatusChange: true,
  notifyCustomerDelivered: true,
  notifyAdminNewOrder: true,
  notifyAdminStatusChange: false,
  notifyAdminPendingReminder: true,
  pendingReminderHours: 2,
};

export function EmailSettingsForm() {
  const [form, setForm] = useState<EmailSettingsFormData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testTo, setTestTo] = useState("udyilangovan@gmail.com");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/email");
      if (res.ok) {
        const data = (await res.json()) as EmailSettingsFormData;
        setForm(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof EmailSettingsFormData>(key: K, value: EmailSettingsFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings");
        return;
      }
      setForm(data);
      setSuccess("Email settings saved successfully.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTestResult("");
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testTo.trim() || form.adminNotifyEmail || form.fromEmail,
          host: form.host,
          port: form.port,
          enableSsl: form.enableSsl,
          username: form.username,
          password: form.password,
          fromEmail: form.fromEmail,
          fromName: form.fromName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult(`Failed: ${data.error ?? "Unknown error"}`);
        return;
      }
      if (data.settings) {
        setForm((prev) => ({
          ...prev,
          ...data.settings,
          adminNotifyEmail: data.adminNotifyEmail ?? data.settings.adminNotifyEmail ?? prev.adminNotifyEmail,
          password: data.settings.hasPassword ? data.settings.password : prev.password,
        }));
      }
      setTestResult(
        `Test email sent to ${data.to}${!form.enabled ? " — turn on Email Notifications (Enabled) and Save for order alerts to send." : ""}`,
      );
    } catch {
      setTestResult("Network error during test.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading email settings…</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Email Notifications</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Configure SMTP and control all email alerts from one place.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-brandbg px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            {form.enabled ? "Enabled" : "Disabled"}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">Admin notification email</span>
            <input
              type="email"
              className="input"
              value={form.adminNotifyEmail}
              onChange={(e) => update("adminNotifyEmail", e.target.value)}
              placeholder="admin@srkcrackers.in"
            />
            <span className="mt-1 block text-xs text-ink-muted">
              All admin alerts and reminders are sent to this address.
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-ink">SMTP Configuration</h3>
        <p className="mt-1 mb-4 text-sm text-ink-muted">Advanced mail server settings (Hostinger, Gmail, etc.)</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">SMTP Host</span>
            <input
              className="input"
              value={form.host}
              onChange={(e) => update("host", e.target.value)}
              placeholder="smtp.hostinger.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Port</span>
            <input
              type="number"
              className="input"
              value={form.port}
              onChange={(e) => update("port", Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              checked={form.enableSsl}
              onChange={(e) => update("enableSsl", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium text-ink">Enable SSL/TLS</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Username</span>
            <input
              className="input"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="admin@srkcrackers.in"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Password</span>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={form.hasPassword ? "Enter password to update, or leave as saved" : "SMTP password"}
              autoComplete="new-password"
            />
            {!form.hasPassword && (
              <span className="mt-1 block text-xs text-amber-700">
                Password not saved yet — enter it here before Send test.
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">From email</span>
            <input
              type="email"
              className="input"
              value={form.fromEmail}
              onChange={(e) => update("fromEmail", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">From name</span>
            <input
              className="input"
              value={form.fromName}
              onChange={(e) => update("fromName", e.target.value)}
            />
          </label>
        </div>

        <label className="mt-4 block max-w-md">
          <span className="mb-1 block text-xs font-semibold text-ink">Test recipient email</span>
          <input
            type="email"
            className="input"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="your-email@gmail.com"
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Sends a test using the SMTP settings above (saves password automatically if test succeeds).
          </span>
        </label>

        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="mt-4 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
        >
          {testing ? "Sending test…" : "Send test email"}
        </button>
        {testResult && (
          <p className={`mt-2 text-sm ${testResult.startsWith("Failed") ? "text-red" : "text-green"}`}>
            {testResult}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-ink">Notification Triggers</h3>
        <p className="mt-1 mb-4 text-sm text-ink-muted">
          Enable each alert and preview the exact email template customers or admin will receive.
        </p>

        <div className="space-y-3">
          {NOTIFICATION_TRIGGER_META.map((meta) => (
            <NotificationTriggerCard
              key={meta.formKey}
              icon={meta.icon}
              label={meta.label}
              description={meta.description}
              audience={meta.audience}
              timing={
                meta.formKey === "notifyAdminPendingReminder"
                  ? `Repeating — every ${form.pendingReminderHours}h via in-app scheduler`
                  : meta.timing
              }
              checked={form[meta.formKey]}
              onChange={(v) => update(meta.formKey, v)}
              previewTrigger={meta.previewTrigger}
              extra={
                meta.formKey === "notifyAdminPendingReminder" && form.notifyAdminPendingReminder ? (
                  <label className="block max-w-xs">
                    <span className="mb-1 block text-xs font-semibold text-ink">
                      Reminder interval (hours)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      className="input"
                      value={form.pendingReminderHours}
                      onChange={(e) => update("pendingReminderHours", Number(e.target.value))}
                    />
                  </label>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red/10 p-2.5 text-sm text-red">{error}</p>}
      {success && <p className="rounded-lg bg-green/10 p-2.5 text-sm text-green">{success}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? "Saving…" : "Save email settings"}
      </button>
    </form>
  );
}
