"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { ORDER_STATUSES } from "@/lib/constants";
import { canCustomerRequestCancel } from "@/lib/order-status";
import { startRazorpayCheckout } from "@/lib/razorpay-checkout";
import { downloadOrderInvoice, trackResultToInvoice } from "@/lib/invoice";
import { formatDateTime, formatPrice, isValidPhone } from "@/lib/utils";
import type { TrackOrderResult } from "@/types";

const TIMELINE = ORDER_STATUSES.filter((s) => s.timeline);

export function TrackOrder() {
  const trackPrefill = useUI((s) => s.trackPrefill);
  const setTrackPrefill = useUI((s) => s.setTrackPrefill);
  const showToast = useToast((s) => s.show);

  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [trackedOrderNumber, setTrackedOrderNumber] = useState("");
  const [trackedPhone, setTrackedPhone] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [repayBusy, setRepayBusy] = useState(false);
  const [razorpayOn, setRazorpayOn] = useState(false);

  const runTrack = useCallback(
    async (id: string, mobile: string) => {
      if (!id.trim() || !isValidPhone(mobile)) {
        showToast("Enter Order ID and 10-digit mobile number");
        return;
      }
      setLoading(true);
      setNotFound(false);
      setResult(null);
      setTrackedOrderNumber(id.trim());
      setTrackedPhone(mobile.trim());
      try {
        const response = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: id.trim(), phone: mobile.trim() }),
        });
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok) {
          const data = await response.json();
          showToast(data.error ?? "Could not track order");
          return;
        }
        setResult((await response.json()) as TrackOrderResult);
      } catch {
        showToast("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void fetch("/api/payments/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRazorpayOn(Boolean(data?.razorpayEnabled)))
      .catch(() => setRazorpayOn(false));
  }, []);

  useEffect(() => {
    if (trackPrefill) {
      setOrderNumber(trackPrefill.orderNumber);
      if (trackPrefill.phone && isValidPhone(trackPrefill.phone)) {
        setPhone(trackPrefill.phone);
        runTrack(trackPrefill.orderNumber, trackPrefill.phone);
      }
      setTrackPrefill(null);
    }
  }, [trackPrefill, runTrack, setTrackPrefill]);

  const currentIdx = result ? TIMELINE.findIndex((s) => s.key === result.status) : -1;
  const isCancelled = result?.status === "CANCELLED";
  const canCancel =
    !!result &&
    canCustomerRequestCancel(result.status) &&
    result.cancelStatus !== "PENDING" &&
    result.cancelStatus !== "APPROVED";

  const handleDownloadInvoice = async () => {
    if (!result) return;
    setInvoiceLoading(true);
    try {
      await downloadOrderInvoice(trackResultToInvoice(result));
      showToast("Invoice downloaded!");
    } catch {
      showToast("Could not download invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const submitCancel = async () => {
    if (!result || !trackedOrderNumber || !trackedPhone) return;
    if (!cancelReason.trim()) {
      setCancelError("Please tell us the reason for cancellation.");
      return;
    }
    setCancelBusy(true);
    setCancelError("");
    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: trackedOrderNumber,
          phone: trackedPhone,
          reason: cancelReason,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCancelError(data.error ?? "Could not send cancellation request. Please try again.");
        return;
      }
      setCancelOpen(false);
      setCancelReason("");
      showToast(data.message ?? "Cancellation request sent!");
      const fresh = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: trackedOrderNumber, phone: trackedPhone }),
      });
      if (fresh.ok) setResult((await fresh.json()) as TrackOrderResult);
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelBusy(false);
    }
  };

  const handleRepay = async () => {
    if (!result || !trackedOrderNumber || !trackedPhone) return;
    setRepayBusy(true);
    try {
      const pay = await startRazorpayCheckout({
        orderNumber: trackedOrderNumber,
        phone: trackedPhone,
        source: "repay",
      });
      if (!pay.ok) {
        showToast(pay.error);
        return;
      }
      showToast(pay.alreadyPaid ? "This order is already paid." : "Payment successful!");
      const fresh = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: trackedOrderNumber, phone: trackedPhone }),
      });
      if (fresh.ok) setResult((await fresh.json()) as TrackOrderResult);
    } catch {
      showToast("Network error. If money was deducted, wait a minute and track again.");
    } finally {
      setRepayBusy(false);
    }
  };

  return (
    <section id="track" className="relative isolate overflow-hidden bg-brandbg px-4 py-14">
      <SectionDecor variant="sparklers" />
      <div className="mx-auto max-w-2xl">
        <SectionHead
          title="Track Your Order"
          subtitle="Enter your Order ID and registered mobile number"
        />
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink">
                Order ID <span className="text-red">*</span>
              </span>
              <input
                className="input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. SRK-20260618-A3F2"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink">
                Mobile Number <span className="text-red">*</span>
              </span>
              <input
                className="input"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile used while ordering"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => runTrack(orderNumber, phone)}
            disabled={loading}
            className="btn-primary mt-4 w-full disabled:opacity-50"
          >
            {loading ? "Tracking..." : "Track Order"}
          </button>

          {notFound && (
            <p className="mt-4 rounded-lg bg-red/10 p-3 text-center text-sm text-red">
              Order not found. Please check Order ID and mobile number.
            </p>
          )}

          {result && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-primary">
                  {result.orderNumber}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isCancelled ? "bg-red text-white" : "bg-primary text-white"
                  }`}
                >
                  {result.statusLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Placed on {formatDateTime(result.createdAt)} · Subtotal {formatPrice(result.subtotal)}
                {` · Shipping ${formatPrice(result.shipping)}`}
                {" · Total "}
                {formatPrice(result.total)}
              </p>

              {razorpayOn && result.canRepay && (
                <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-950">
                  <p className="font-semibold">Payment not completed</p>
                  <p className="mt-1 text-xs">You can pay now with Razorpay (UPI / card).</p>
                  <button
                    type="button"
                    onClick={() => void handleRepay()}
                    disabled={repayBusy}
                    className="btn-primary mt-3 w-full py-2 text-sm disabled:opacity-50"
                  >
                    {repayBusy ? "Opening payment…" : `Pay ${formatPrice(result.total)} now`}
                  </button>
                </div>
              )}

              {result.status === "DISPATCHED" && result.expectedDeliveryAt && (
                <p className="mt-2 rounded-lg bg-primary/5 p-3 text-xs text-ink">
                  📦 Parcel handed to postal. Expected delivery by{" "}
                  <strong>{formatDateTime(result.expectedDeliveryAt)}</strong>. Status will update
                  automatically when delivered.
                </p>
              )}

              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={invoiceLoading}
                className="btn-outline mt-4 w-full text-sm disabled:opacity-50"
              >
                {invoiceLoading ? "Preparing invoice..." : "Download Invoice (PDF)"}
              </button>

              <div className="mt-4 rounded-lg bg-brandbg p-3 text-xs">
                <p className="mb-2 font-semibold text-ink">Order Items</p>
                <ul className="space-y-1">
                  {result.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 text-ink-muted">
                      <span className="truncate">
                        {item.name} ({item.pack}) × {item.qty}
                      </span>
                      <span className="shrink-0 font-medium text-ink">{formatPrice(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {result.cancelStatus === "PENDING" && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  🕐 <strong>Cancellation requested.</strong> Our team is reviewing your request and
                  will contact you shortly. If your payment has been collected, it will be refunded
                  after approval.
                </div>
              )}

              {result.cancelStatus === "DECLINED" && (
                <div className="mt-4 rounded-lg bg-red/5 p-3 text-sm text-ink">
                  <strong className="text-red">Cancellation request declined.</strong> Your order will
                  continue as planned.
                  {result.cancelAdminNote?.trim() && (
                    <span className="mt-1 block text-xs text-ink-muted">
                      Note from our team: {result.cancelAdminNote.trim()}
                    </span>
                  )}
                </div>
              )}

              {canCancel && !cancelOpen && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs text-ink-muted">
                    Changed your mind? You can request cancellation as long as the parcel has not been
                    dispatched. A team member will review and confirm your refund.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError("");
                      setCancelOpen(true);
                    }}
                    className="btn-outline mt-3 w-full py-2 text-sm text-red"
                  >
                    Request Cancellation
                  </button>
                </div>
              )}

              {canCancel && cancelOpen && (
                <div className="mt-5 rounded-lg border border-red/30 bg-red/5 p-4">
                  <p className="text-sm font-semibold text-ink">Request cancellation</p>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold text-ink">
                      Reason <span className="text-red">*</span>
                    </span>
                    <textarea
                      className="input min-h-20 w-full resize-y text-sm"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Why do you want to cancel this order?"
                      maxLength={500}
                    />
                  </label>
                  {cancelError && (
                    <p className="mt-2 text-xs text-red">{cancelError}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void submitCancel()}
                      disabled={cancelBusy}
                      className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
                    >
                      {cancelBusy ? "Sending..." : "Send Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelOpen(false);
                        setCancelError("");
                      }}
                      disabled={cancelBusy}
                      className="btn-outline flex-1 py-2 text-sm disabled:opacity-50"
                    >
                      Go Back
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-ink-muted">
                    Your refund will be processed by phone/UPI after the team approves the cancellation.
                  </p>
                </div>
              )}

              {isCancelled ? (
                <p className="mt-4 rounded-lg bg-red/10 p-3 text-sm text-red">
                  This order has been cancelled. Contact us for details.
                </p>
              ) : (
                <ul className="mt-5 space-y-0">
                  {TIMELINE.map((status, idx) => {
                    const state =
                      idx < currentIdx ? "done" : idx === currentIdx ? "current" : "pending";
                    const historyEntry = [...result.statusHistory]
                      .reverse()
                      .find((h) => h.status === status.key);
                    return (
                      <li key={status.key} className="flex gap-3 pb-5 last:pb-0">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              state === "done"
                                ? "bg-green text-white"
                                : state === "current"
                                  ? "bg-primary text-white ring-4 ring-primary/20"
                                  : "bg-line text-ink-muted"
                            }`}
                          >
                            {state === "done" ? "✓" : idx + 1}
                          </span>
                          {idx < TIMELINE.length - 1 && (
                            <span
                              className={`mt-1 w-0.5 flex-1 ${
                                idx < currentIdx ? "bg-green" : "bg-line"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-1">
                          <p
                            className={`text-sm font-medium ${
                              state === "pending" ? "text-ink-muted" : "text-ink"
                            }`}
                          >
                            {status.label}
                          </p>
                          {historyEntry && (
                            <p className="text-xs text-ink-muted">
                              {formatDateTime(historyEntry.createdAt)}
                            </p>
                          )}
                          {historyEntry?.note?.trim() && (
                            <p className="mt-1.5 rounded-md bg-brandbg px-2.5 py-1.5 text-xs leading-relaxed text-ink">
                              {historyEntry.note}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
