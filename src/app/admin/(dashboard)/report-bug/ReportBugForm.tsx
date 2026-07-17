"use client";

import Image from "next/image";
import { useState } from "react";

const AREAS = [
  "Dashboard",
  "Orders",
  "Products",
  "Categories",
  "Analytics",
  "Notifications",
  "Settings",
  "Storefront / Checkout",
  "Push notifications",
  "Other",
] as const;

const SEVERITIES = ["Low", "Medium", "High"] as const;

export function ReportBugForm() {
  const [area, setArea] = useState<(typeof AREAS)[number]>("Orders");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("Medium");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          severity,
          description,
          steps,
          pageUrl: pageUrl || (typeof window !== "undefined" ? window.location.href : ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send bug report.");
        return;
      }
      setDescription("");
      setSteps("");
      setPageUrl("");
      setSuccess("Bug report sent. You will receive a notification on your ntfy device shortly.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Image
          src="/logo.png"
          alt="SRK Crackers"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full ring-2 ring-primary/20"
        />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Report a Bug</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tell us what went wrong. Your report is sent instantly to the developer via{" "}
            <a
              href="https://ntfy.sh/udyilangovan"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              ntfy
            </a>
            , with the SRK logo on the alert.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-line bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Area</span>
            <select
              className="input"
              value={area}
              onChange={(e) => setArea(e.target.value as (typeof AREAS)[number])}
              required
            >
              {AREAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Severity</span>
            <select
              className="input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as (typeof SEVERITIES)[number])}
              required
            >
              {SEVERITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink">Page URL (optional)</span>
          <input
            type="url"
            className="input"
            placeholder="https://www.srkcrackers.in/admin/orders"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink">What went wrong?</span>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Example: On the Orders page, the status filter does not update the list after I select Payment Pending."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={10}
            maxLength={4000}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink">
            Steps to reproduce (optional)
          </span>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="1. Open Orders&#10;2. Select Payment Pending&#10;3. List stays unchanged"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            maxLength={2000}
          />
        </label>

        {error && <p className="rounded-lg bg-red/10 p-2.5 text-sm text-red">{error}</p>}
        {success && <p className="rounded-lg bg-green/10 p-2.5 text-sm text-green">{success}</p>}

        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Sending…" : "Send bug report"}
        </button>
      </form>
    </div>
  );
}
