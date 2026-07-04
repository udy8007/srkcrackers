"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUSES } from "@/lib/constants";

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
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

  return (
    <div className="space-y-3">
      <select
        className="input"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <textarea
        className="input min-h-16"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g. courier name, tracking id)"
      />
      <button type="button" onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-50">
        {saving ? "Saving..." : "Update Status"}
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
