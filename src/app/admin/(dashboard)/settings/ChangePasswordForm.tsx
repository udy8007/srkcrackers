"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">Current password</span>
        <input
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">New password</span>
        <input
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-1 block text-xs text-ink-muted">Minimum 8 characters</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">Confirm new password</span>
        <input
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error && <p className="rounded-lg bg-red/10 p-2.5 text-sm text-red">{error}</p>}
      {success && <p className="rounded-lg bg-green/10 p-2.5 text-sm text-green">{success}</p>}

      <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
