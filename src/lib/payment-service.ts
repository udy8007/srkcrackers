import "server-only";
import type { OrderStatus } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { writeAuditLog } from "@/lib/audit-log";
import { dispatchNotification, notifyOrderPlaced, notifyPaymentEvent } from "@/lib/notifications";
import { canCustomerRepay } from "@/lib/order-status";
import {
  checkoutBrand,
  checkoutPrefill,
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  fetchRazorpayPayment,
  isRazorpayConfigured,
  getRazorpayKeyId,
  paymentLog,
  rupeesToPaise,
  type RazorpayApiPayment,
} from "@/lib/razorpay";

const PAID_ADVANCE_STATUSES: OrderStatus[] = ["PAYMENT_PENDING", "PLACED", "PAYMENT_UPLOADED", "VERIFYING"];

export type PaymentCheckoutSession = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  name: string;
  description: string;
  prefill: { name: string; email?: string; contact: string; method?: string };
  theme: { color: string };
  notes: Record<string, string>;
};

function safePayload(value: unknown): string {
  try {
    return JSON.stringify(value).slice(0, 8000);
  } catch {
    return "";
  }
}

async function logAttempt(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  amount: number;
  status: string;
  method?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  source: string;
  payload?: unknown;
}) {
  await prisma.paymentAttempt.create({
    data: {
      orderId: input.orderId,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId ?? null,
      amount: input.amount,
      status: input.status,
      method: input.method ?? null,
      errorCode: input.errorCode ?? null,
      errorDescription: input.errorDescription ?? null,
      source: input.source,
      payload: input.payload ? safePayload(input.payload) : null,
    },
  });
}

function nextStatusAfterPaid(current: OrderStatus): OrderStatus {
  if (PAID_ADVANCE_STATUSES.includes(current)) return "CONFIRMED";
  return current;
}

function paidHistory(from: OrderStatus, now: Date) {
  const rows: { status: OrderStatus; label: string; note: string; createdAt: Date }[] = [];
  if (from === "PAYMENT_PENDING") {
    rows.push({
      status: "PLACED",
      label: ORDER_STATUS_LABEL.PLACED,
      note: "Customer completed Razorpay checkout",
      createdAt: now,
    });
  }
  if (from === "PAYMENT_PENDING" || from === "PLACED") {
    rows.push({
      status: "PAYMENT_UPLOADED",
      label: ORDER_STATUS_LABEL.PAYMENT_UPLOADED,
      note: "Razorpay payment captured",
      createdAt: now,
    });
    rows.push({
      status: "VERIFYING",
      label: ORDER_STATUS_LABEL.VERIFYING,
      note: "Payment verified automatically by Razorpay",
      createdAt: now,
    });
  }
  const next = nextStatusAfterPaid(from);
  if (next !== from) {
    rows.push({
      status: next,
      label: ORDER_STATUS_LABEL[next],
      note: "Paid online — order confirmed for packing",
      createdAt: now,
    });
  }
  return { next, rows };
}

export async function createPaymentCheckoutSession(input: {
  orderId?: string;
  orderNumber?: string;
  phone?: string;
  source: "checkout" | "repay";
}): Promise<
  | { ok: true; alreadyPaid: true; orderNumber: string; status: OrderStatus }
  | { ok: true; alreadyPaid?: false; session: PaymentCheckoutSession }
  | { ok: false; error: string; status: number }
> {
  if (!isRazorpayConfigured()) {
    return { ok: false, error: "Online payment is not available right now. Please try again later.", status: 503 };
  }

  const order = input.orderId
    ? await prisma.order.findUnique({ where: { id: input.orderId } })
    : await prisma.order.findFirst({
        where: {
          orderNumber: input.orderNumber?.trim().toUpperCase(),
          phone: input.phone?.trim(),
        },
      });

  if (!order) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  if (order.paymentStatus === "PAID" && order.razorpayPaymentId) {
    paymentLog("session_already_paid", { orderNumber: order.orderNumber, source: input.source });
    return { ok: true, alreadyPaid: true, orderNumber: order.orderNumber, status: order.status };
  }

  if (order.status === "CANCELLED") {
    return { ok: false, error: "This order is cancelled and cannot be paid.", status: 400 };
  }

  if (!canCustomerRepay(order.status, order.paymentStatus) && input.source === "repay") {
    return { ok: false, error: "This order cannot be paid again.", status: 400 };
  }

  if (order.status !== "PAYMENT_PENDING" && input.source === "checkout" && order.paymentStatus === "PAID") {
    return { ok: true, alreadyPaid: true, orderNumber: order.orderNumber, status: order.status };
  }

  const amountPaise = rupeesToPaise(order.total);
  let razorpayOrderId = order.razorpayOrderId;

  if (razorpayOrderId) {
    try {
      const existing = await fetchRazorpayOrder(razorpayOrderId);
      if (existing.status === "paid") {
        const payments = await fetchRazorpayOrderPayments(razorpayOrderId);
        const captured = payments.find((p) => p.status === "captured" || p.status === "authorized");
        const paid = await markOrderPaid({
          orderId: order.id,
          razorpayOrderId,
          razorpayPaymentId: captured?.id ?? null,
          amountPaise: existing.amount,
          method: captured?.method ?? "razorpay",
          source: input.source,
          payload: { existing, captured },
        });
        if (paid.ok) {
          return { ok: true, alreadyPaid: true, orderNumber: order.orderNumber, status: paid.status };
        }
        return { ok: false, error: paid.error, status: 400 };
      }
      if ((existing.status === "created" || existing.status === "attempted") && existing.amount === amountPaise) {
        paymentLog("session_reuse_order", {
          orderNumber: order.orderNumber,
          razorpayOrderId,
          rzStatus: existing.status,
          source: input.source,
        });
      } else {
        razorpayOrderId = null;
      }
    } catch (error) {
      paymentLog("session_fetch_existing_failed", {
        orderNumber: order.orderNumber,
        razorpayOrderId,
        error: error instanceof Error ? error.message : String(error),
      });
      razorpayOrderId = null;
    }
  }

  if (!razorpayOrderId) {
    const created = await createRazorpayOrder({
      amountPaise,
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        phone: order.phone,
      },
    });
    razorpayOrderId = created.id;
    paymentLog("session_created_order", {
      orderNumber: order.orderNumber,
      razorpayOrderId,
      amountPaise,
      source: input.source,
    });
    await logAttempt({
      orderId: order.id,
      razorpayOrderId,
      amount: amountPaise,
      status: "created",
      source: input.source,
      payload: created,
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      razorpayOrderId,
      paymentMethod: "Razorpay",
      paymentStatus: order.paymentStatus === "PAID" ? "PAID" : "INITIATED",
    },
  });

  await writeAuditLog({
    action: "PAYMENT_INITIATED",
    entityType: "order",
    entityId: order.id,
    summary: `Razorpay checkout started for ${order.orderNumber}`,
    metadata: { razorpayOrderId, source: input.source, amountPaise },
  });

  const brand = checkoutBrand();
  const prefill = checkoutPrefill(order);
  return {
    ok: true,
    session: {
      keyId: getRazorpayKeyId(),
      razorpayOrderId,
      amount: amountPaise,
      currency: "INR",
      orderNumber: order.orderNumber,
      name: brand.name,
      description: `${brand.description} ${order.orderNumber}`,
      prefill: { name: prefill.name, email: prefill.email, contact: prefill.contact, method: prefill.method },
      theme: brand.theme,
      notes: { orderNumber: order.orderNumber, orderId: order.id },
    },
  };
}

export async function markOrderPaid(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  method?: string | null;
  source: string;
  payload?: unknown;
}): Promise<{ ok: true; alreadyPaid: boolean; status: OrderStatus } | { ok: false; error: string }> {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });
    if (!order) return { kind: "missing" as const };
    if (order.status === "CANCELLED") return { kind: "cancelled" as const, order };

    if (order.paymentStatus === "PAID") {
      return { kind: "already" as const, order };
    }

    const now = new Date();
    const { next, rows } = paidHistory(order.status, now);

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "Razorpay",
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        paidAt: now,
        status: next,
        statusHistory: rows.length ? { create: rows } : undefined,
      },
    });

    await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        amount: input.amountPaise,
        status: "captured",
        method: input.method ?? null,
        source: input.source,
        payload: input.payload ? safePayload(input.payload) : null,
      },
    });

    return { kind: "paid" as const, order, updated };
  });

  if (result.kind === "missing") return { ok: false, error: "Order not found" };
  if (result.kind === "cancelled") {
    paymentLog("paid_but_cancelled", {
      orderNumber: result.order.orderNumber,
      razorpayPaymentId: input.razorpayPaymentId,
      source: input.source,
    });
    await logAttempt({
      orderId: result.order.id,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      amount: input.amountPaise,
      status: "captured_cancelled_order",
      method: input.method,
      source: input.source,
      payload: input.payload,
    });
    dispatchNotification(() =>
      notifyPaymentEvent(result.order.id, {
        type: "PAYMENT_ON_CANCELLED",
        title: `Payment received on cancelled order ${result.order.orderNumber}`,
        message: `Razorpay captured ₹${Math.round(input.amountPaise / 100)} after cancellation. Refund may be required.`,
      }),
    );
    return { ok: false, error: "Order is cancelled — payment captured and flagged for refund" };
  }

  if (result.kind === "already") {
    paymentLog("paid_idempotent", {
      orderNumber: result.order.orderNumber,
      razorpayPaymentId: input.razorpayPaymentId,
      source: input.source,
    });
    return { ok: true, alreadyPaid: true, status: result.order.status };
  }

  paymentLog("paid_success", {
    orderNumber: result.updated.orderNumber,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    fromStatus: result.order.status,
    toStatus: result.updated.status,
    source: input.source,
  });

  await writeAuditLog({
    action: "PAYMENT_CAPTURED",
    entityType: "order",
    entityId: result.updated.id,
    summary: `Razorpay payment captured for ${result.updated.orderNumber}`,
    metadata: {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      source: input.source,
      fromStatus: result.order.status,
      toStatus: result.updated.status,
    },
  });

  const wasDraft = result.order.status === "PAYMENT_PENDING";
  dispatchNotification(async () => {
    if (wasDraft) {
      await notifyOrderPlaced(result.updated.id);
    } else {
      await notifyPaymentEvent(result.updated.id, {
        type: "PAYMENT_RECEIVED",
        title: `Payment received ${result.updated.orderNumber}`,
        message: `${result.updated.customerName} paid ₹${result.updated.total.toLocaleString("en-IN")} via Razorpay`,
      });
    }
  });

  return { ok: true, alreadyPaid: false, status: result.updated.status };
}

export async function markPaymentFailed(input: {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string | null;
  amountPaise?: number;
  method?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  source: string;
  payload?: unknown;
}) {
  const order = input.orderId
    ? await prisma.order.findUnique({ where: { id: input.orderId } })
    : input.razorpayOrderId
      ? await prisma.order.findFirst({ where: { razorpayOrderId: input.razorpayOrderId } })
      : null;

  if (!order) {
    paymentLog("fail_order_missing", {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      source: input.source,
    });
    return;
  }

  if (order.paymentStatus === "PAID") {
    paymentLog("fail_ignored_already_paid", { orderNumber: order.orderNumber, source: input.source });
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "FAILED" },
  });

  await logAttempt({
    orderId: order.id,
    razorpayOrderId: input.razorpayOrderId || order.razorpayOrderId || "",
    razorpayPaymentId: input.razorpayPaymentId,
    amount: input.amountPaise ?? rupeesToPaise(order.total),
    status: "failed",
    method: input.method,
    errorCode: input.errorCode,
    errorDescription: input.errorDescription,
    source: input.source,
    payload: input.payload,
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: order.status,
      label: ORDER_STATUS_LABEL[order.status],
      note: `Payment failed${input.errorDescription ? `: ${input.errorDescription}` : ""}. Customer can repay from Track Order.`,
    },
  });

  paymentLog("fail_recorded", {
    orderNumber: order.orderNumber,
    errorCode: input.errorCode,
    errorDescription: input.errorDescription,
    source: input.source,
  });

  await writeAuditLog({
    action: "PAYMENT_FAILED",
    entityType: "order",
    entityId: order.id,
    summary: `Razorpay payment failed for ${order.orderNumber}`,
    metadata: {
      errorCode: input.errorCode,
      errorDescription: input.errorDescription,
      source: input.source,
    },
  });

  dispatchNotification(() =>
    notifyPaymentEvent(order.id, {
      type: "PAYMENT_FAILED",
      title: `Payment failed ${order.orderNumber}`,
      message: `${order.customerName} could not complete Razorpay (${input.errorDescription || "failed/dismissed"}). They can repay from the storefront.`,
    }),
  );
}

export async function recordCheckoutDismissed(orderId: string, razorpayOrderId: string, source: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") return;
  await logAttempt({
    orderId,
    razorpayOrderId,
    amount: rupeesToPaise(order.total),
    status: "dismissed",
    source,
  });
  paymentLog("checkout_dismissed", { orderNumber: order.orderNumber, source });
}

export async function applyCapturedPayment(
  payment: RazorpayApiPayment,
  source: string,
): Promise<{ ok: true; alreadyPaid: boolean; status: OrderStatus; orderNumber: string } | { ok: false; error: string }> {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: payment.order_id },
  });
  if (!order) {
    return { ok: false, error: "No local order for this Razorpay payment" };
  }
  const marked = await markOrderPaid({
    orderId: order.id,
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
    amountPaise: payment.amount,
    method: payment.method,
    source,
    payload: payment,
  });
  if (!marked.ok) return marked;
  return { ...marked, orderNumber: order.orderNumber };
}

export async function verifyAndCaptureCheckout(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  source: "verify";
}) {
  const payment = await fetchRazorpayPayment(input.razorpayPaymentId);
  if (payment.order_id !== input.razorpayOrderId) {
    return { ok: false as const, error: "Payment does not match this order", status: 400 };
  }
  if (payment.status !== "captured" && payment.status !== "authorized") {
    await markPaymentFailed({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      amountPaise: payment.amount,
      method: payment.method,
      errorCode: payment.error_code,
      errorDescription: payment.error_description || `status=${payment.status}`,
      source: input.source,
      payload: payment,
    });
    return { ok: false as const, error: "Payment was not successful. You can try again.", status: 400 };
  }
  const applied = await applyCapturedPayment(payment, input.source);
  if (!applied.ok) return { ok: false as const, error: applied.error, status: 400 };
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId: input.razorpayOrderId },
    include: { items: true },
  });
  return {
    ok: true as const,
    alreadyPaid: applied.alreadyPaid,
    orderNumber: applied.orderNumber,
    status: applied.status,
    createdAt: order?.createdAt.toISOString(),
    subtotal: order?.subtotal,
    shipping: order ? order.total - order.subtotal : 0,
    total: order?.total,
  };
}
