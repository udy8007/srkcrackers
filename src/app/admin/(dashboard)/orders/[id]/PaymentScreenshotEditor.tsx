"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { compressImage } from "@/lib/client-actions";
import { canAdminEditBeforeDispatch } from "@/lib/order-status";

const MAX_SCREENSHOT_CHARS = 3_000_000;

export function PaymentScreenshotEditor({
  orderId,
  status,
  currentScreenshot,
}: {
  orderId: string;
  status: OrderStatus;
  currentScreenshot: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(currentScreenshot);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const editable = canAdminEditBeforeDispatch(status);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5 MB" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length > MAX_SCREENSHOT_CHARS) {
        setMessage({ type: "error", text: "Image is too large after compression" });
        return;
      }
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentScreenshot: dataUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Upload failed" });
        return;
      }
      setPreview(dataUrl);
      setMessage({ type: "ok", text: "Payment screenshot updated" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Could not upload image" });
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  if (!editable && !preview) {
    return (
      <p className="rounded-lg bg-brandbg p-4 text-center text-sm text-ink-muted">
        No payment screenshot on file
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <a href={preview} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Payment screenshot"
            className="max-h-64 rounded-lg border border-line"
          />
        </a>
      ) : (
        <p className="rounded-lg bg-brandbg p-4 text-center text-sm text-ink-muted">
          No screenshot uploaded yet
        </p>
      )}
      {editable ? (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-line bg-brandbg p-4 text-center transition hover:border-primary">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={saving}
            className="hidden"
          />
          <span className="text-sm font-semibold text-ink">
            {saving ? "Uploading..." : preview ? "Replace screenshot" : "Upload screenshot"}
          </span>
          <span className="text-xs text-ink-muted">Allowed until order is dispatched</span>
        </label>
      ) : (
        <p className="text-xs text-ink-muted">
          Parcel handed to postal — payment screenshot locked after dispatch.
        </p>
      )}
      {message && (
        <p
          className={`rounded-lg p-2 text-center text-xs font-medium ${
            message.type === "ok" ? "bg-green/10 text-green" : "bg-red/10 text-red"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
