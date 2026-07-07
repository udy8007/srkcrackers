"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EmailPreviewData {
  subject: string;
  html: string;
}

export function EmailPreviewPanel({
  trigger,
  open,
  onClose,
}: {
  trigger: string;
  open: boolean;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<EmailPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/settings/email/preview?trigger=${encodeURIComponent(trigger)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load preview");
        return;
      }
      setPreview(data);
    } catch {
      setError("Network error loading preview.");
    } finally {
      setLoading(false);
    }
  }, [open, trigger]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Email preview</h3>
            {preview && (
              <p className="mt-0.5 text-xs text-ink-muted">
                Subject: <span className="font-medium text-ink">{preview.subject}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-brandbg"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-brandbg p-4">
          {loading && <p className="text-center text-sm text-ink-muted">Loading preview…</p>}
          {error && <p className="text-center text-sm text-red">{error}</p>}
          {preview && !loading && (
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              className="h-[min(70vh,640px)] w-full rounded-lg border border-line bg-white"
              sandbox=""
            />
          )}
        </div>

        <p className="border-t border-line px-5 py-2 text-center text-[0.65rem] text-ink-muted">
          Sample data shown — actual emails use real order details
        </p>
      </div>
    </div>
  );
}

export function NotificationTriggerCard({
  icon,
  label,
  description,
  audience,
  timing,
  checked,
  onChange,
  previewTrigger,
  extra,
}: {
  icon: string;
  label: string;
  description: string;
  audience: "Customer" | "Admin";
  timing: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  previewTrigger: string;
  extra?: React.ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition",
          checked ? "border-primary/30 bg-white" : "border-line bg-brandbg/40",
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandbg text-xl">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <span className="text-xs font-medium text-ink-muted">{checked ? "On" : "Off"}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                  audience === "Customer" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800",
                )}
              >
                {audience}
              </span>
              <span className="rounded-full bg-brandbg px-2 py-0.5 text-[0.65rem] font-medium text-ink-muted">
                {timing}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Preview email template →
            </button>
          </div>
        </div>

        {extra && <div className="border-t border-line px-4 pb-4 pt-3">{extra}</div>}
      </div>

      <EmailPreviewPanel
        trigger={previewTrigger}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
