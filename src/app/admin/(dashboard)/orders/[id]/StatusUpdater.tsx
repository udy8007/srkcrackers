"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/db/types";
import { BUSINESS, ORDER_STATUSES } from "@/lib/constants";
import { canAdminEditBeforeDispatch } from "@/lib/order-status";
import { formatDateTime } from "@/lib/utils";

function defaultExpectedDeliveryLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + BUSINESS.defaultDeliveryDays);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const MANUAL_STATUSES = ORDER_STATUSES.filter((s) => s.key !== "DELIVERED");

export function StatusUpdater({
  orderId,
  currentStatus,
  expectedDeliveryAt,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  expectedDeliveryAt: Date | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [expectedAt, setExpectedAt] = useState(defaultExpectedDeliveryLocal());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const locked =
    currentStatus === "DISPATCHED" ||
    currentStatus === "DELIVERED" ||
    currentStatus === "CANCELLED";

  const save = async () => {
    if (locked) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = { status, note: note.trim() };
      if (status === "DISPATCHED") {
        if (!expectedAt) {
          setMessage({ type: "error", text: "Set expected delivery date & time" });
          setSaving(false);
          return;
        }
        payload.expectedDeliveryAt = new Date(expectedAt).toISOString();
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        setMessage({ type: "error", text: data.error ?? "Update failed" });
        return;
      }
      setNote("");
      setMessage({ type: "ok", text: "Status updated" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  if (currentStatus === "DISPATCHED") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="font-semibold text-primary">Parcel with postal service</p>
          <p className="mt-1 text-xs text-ink-muted">
            Status is locked after dispatch. Delivery updates automatically when the expected
            time is reached.
          </p>
        </div>
        {expectedDeliveryAt && (
          <div>
            <span className="text-ink-muted">Expected delivery: </span>
            <span className="font-semibold text-ink">{formatDateTime(expectedDeliveryAt)}</span>
          </div>
        )}
        <p className="text-xs text-ink-muted">
          Will auto-change to <strong>Delivered</strong> after this time (hourly scheduler).
        </p>
      </div>
    );
  }

  if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
    return (
      <p className="text-sm text-ink-muted">
        This order is {currentStatus === "DELIVERED" ? "delivered" : "cancelled"}. Status cannot
        be changed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <select
        className="input"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
      >
        {MANUAL_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>

      {status === "DISPATCHED" && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink">
            Expected delivery (postal) <span className="text-red">*</span>
          </span>
          <input
            type="datetime-local"
            className="input"
            value={expectedAt}
            onChange={(e) => setExpectedAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Parcel handed to postal — auto-marked delivered after this time
          </span>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink">
          Comment for customer <span className="font-normal text-ink-muted">(optional)</span>
        </span>
        <textarea
          className="input min-h-16"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            status === "DISPATCHED"
              ? "e.g. Postal receipt no., tracking ID — visible on Track Order"
              : "e.g. Payment verified, packing started — visible on Track Order"
          }
        />
        <span className="mt-1 block text-xs text-ink-muted">
          Shown to the customer on the Track Order page when provided.
        </span>
      </label>
      <button
        type="button"
        onClick={save}
        disabled={saving || !canAdminEditBeforeDispatch(currentStatus)}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? "Saving..." : status === "DISPATCHED" ? "Mark Dispatched → Postal" : "Update Status"}
      </button>
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
