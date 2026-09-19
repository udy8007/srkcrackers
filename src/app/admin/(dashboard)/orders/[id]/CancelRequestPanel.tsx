"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatPrice } from "@/lib/utils";

export type CancelRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export function CancelRequestPanel({
  orderId,
  orderNumber,
  cancelStatus,
  cancelReason,
  cancelRequestedAt,
  cancelAdminNote,
  cancelDecidedAt,
  cancelDecidedBy,
  total,
}: {
  orderId: string;
  orderNumber: string;
  cancelStatus: CancelRequestStatus;
  cancelReason: string | null;
  cancelRequestedAt: Date | null;
  cancelAdminNote: string | null;
  cancelDecidedAt: Date | null;
  cancelDecidedBy: string | null;
  total: number;
}) {
  const router = useRouter();
  const [refundNote, setRefundNote] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const decide = async (action: "approve" | "decline") => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelAction: action,
          cancelNote: action === "approve" ? refundNote : declineNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Update failed" });
        return;
      }
      setMessage({
        type: "ok",
        text: action === "approve" ? "Approved — order cancelled" : "Request declined",
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  if (cancelStatus === "APPROVED") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-green/30 bg-green/5 p-3">
          <p className="font-semibold text-green">✓ Approved — order cancelled</p>
          <p className="mt-1 text-xs text-ink-muted">
            Customer requested cancellation of <strong>{orderNumber}</strong>{" "}
            {cancelRequestedAt ? `on ${formatDateTime(cancelRequestedAt)}` : ""}.
          </p>
        </div>
        {cancelReason?.trim() && (
          <div>
            <span className="text-ink-muted">Customer reason: </span>
            <span className="font-medium text-ink">{cancelReason.trim()}</span>
          </div>
        )}
        {cancelAdminNote?.trim() && (
          <div>
            <span className="text-ink-muted">Refund note: </span>
            <span className="font-medium text-ink">{cancelAdminNote.trim()}</span>
          </div>
        )}
        {cancelDecidedBy && cancelDecidedAt && (
          <p className="text-xs text-ink-muted">
            Decided by <strong>{cancelDecidedBy}</strong> on {formatDateTime(cancelDecidedAt)}.
          </p>
        )}
      </div>
    );
  }

  if (cancelStatus === "DECLINED") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-red/20 bg-red/5 p-3">
          <p className="font-semibold text-red">✕ Request declined — order continues</p>
          <p className="mt-1 text-xs text-ink-muted">
            Customer requested cancellation of <strong>{orderNumber}</strong> for {formatPrice(total)}
            .
          </p>
        </div>
        {cancelReason?.trim() && (
          <div>
            <span className="text-ink-muted">Customer reason: </span>
            <span className="font-medium text-ink">{cancelReason.trim()}</span>
          </div>
        )}
        {cancelAdminNote?.trim() && (
          <div>
            <span className="text-ink-muted">Your note: </span>
            <span className="font-medium text-ink">{cancelAdminNote.trim()}</span>
          </div>
        )}
        {cancelDecidedBy && cancelDecidedAt && (
          <p className="text-xs text-ink-muted">
            Decided by <strong>{cancelDecidedBy}</strong> on {formatDateTime(cancelDecidedAt)}.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="font-semibold text-amber-900">🕐 Customer wants to cancel this order</p>
        <p className="mt-1 text-xs text-amber-900/80">
          <strong>{orderNumber}</strong> · {formatPrice(total)} · requested{" "}
          {cancelRequestedAt ? formatDateTime(cancelRequestedAt) : ""} by phone/UPI. Customer still
          needs to see this decision on their Track Order page.
        </p>
      </div>

      {cancelReason?.trim() && (
        <div className="rounded-lg bg-brandbg p-3">
          <span className="text-ink-muted">Customer reason: </span>
          <span className="font-medium text-ink">{cancelReason.trim()}</span>
        </div>
      )}

      <div className="rounded-xl border border-line bg-white p-3">
        <p className="mb-2 font-semibold text-ink">Approve &amp; cancel (refund the customer)</p>
        <p className="mb-2 text-xs text-ink-muted">
          Refund the UPI payment offline, then note the refund reference (UTR no.) below. The order is
          marked <strong>Cancelled</strong> and the customer is notified by email.
        </p>
        <input
          className="input"
          value={refundNote}
          onChange={(e) => setRefundNote(e.target.value)}
          placeholder="Refund reference / UTR no. (optional)"
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => void decide("approve")}
          disabled={busy}
          className="btn-primary mt-2 w-full bg-red text-white disabled:opacity-50"
        >
          {busy ? "Processing..." : "Approve Cancellation"}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-white p-3">
        <p className="mb-2 font-semibold text-ink">Decline request</p>
        <p className="mb-2 text-xs text-ink-muted">
          Keep the order running. The customer sees this note on their Track Order page.
        </p>
        <input
          className="input"
          value={declineNote}
          onChange={(e) => setDeclineNote(e.target.value)}
          placeholder="Reason for declining (e.g. order already packed)"
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => void decide("decline")}
          disabled={busy}
          className="btn-outline mt-2 w-full disabled:opacity-50"
        >
          {busy ? "Processing..." : "Decline Request"}
        </button>
      </div>

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