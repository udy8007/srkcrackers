"use client";

import { useCallback, useEffect, useState } from "react";

export function PaymentSettingsForm() {
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [keysConfigured, setKeysConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/payment");
      if (res.ok) {
        const data = (await res.json()) as { razorpayEnabled: boolean; keysConfigured: boolean };
        setRazorpayEnabled(data.razorpayEnabled);
        setKeysConfigured(data.keysConfigured);
      }
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
      const res = await fetch("/api/admin/settings/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save payment settings");
        return;
      }
      setRazorpayEnabled(Boolean(data.razorpayEnabled));
      setKeysConfigured(Boolean(data.keysConfigured));
      setSuccess("Payment settings saved.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading payment settings…</p>;
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="max-w-xl rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Online payment</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        When Razorpay is on, checkout opens Razorpay. When it is off, customers pay with the UPI QR as before.
      </p>
      <label className="flex items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={razorpayEnabled}
          onChange={(e) => setRazorpayEnabled(e.target.checked)}
        />
        {razorpayEnabled ? "Razorpay on" : "Razorpay off — UPI QR"}
      </label>
      {!keysConfigured && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Razorpay API keys are not set. Checkout will keep using UPI QR until <code>RAZORPAY_KEY_ID</code> and{" "}
          <code>RAZORPAY_KEY_SECRET</code> are added.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red">{error}</p>}
      {success && <p className="mt-3 text-sm text-green">{success}</p>}
      <button type="submit" disabled={saving} className="btn-primary mt-4 disabled:opacity-50">
        {saving ? "Saving…" : "Save payment settings"}
      </button>
    </form>
  );
}
