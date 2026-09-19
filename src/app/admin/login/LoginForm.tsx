"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { withAppBase } from "@/lib/app-base-path";

export function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") ?? "/admin";
  const callbackUrl = rawCallback.startsWith("/") ? withAppBase(rawCallback) : rawCallback;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      window.location.assign(callbackUrl);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" aria-live="polite">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm font-semibold text-ink">Signing in…</p>
        <p className="text-xs text-ink-muted">Connecting to the database. This can take a few seconds.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">Email</span>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your admin email"
          required
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">Password</span>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </label>

      {error && <p className="rounded-lg bg-red/10 p-2.5 text-center text-sm text-red">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
