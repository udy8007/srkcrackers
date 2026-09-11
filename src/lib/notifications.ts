import "server-only";
import { after } from "next/server";
import type { Order, OrderItem, OrderStatus } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { getEmailSettings, resolveAdminNotifyEmail, resolveSiteOrigin } from "@/lib/email-settings";
import { sendEmail } from "@/lib/email";
import { sendAdminPush } from "@/lib/admin-push";
import {
  buildAdminEnquiryPendingReminderEmail,
  buildAdminNewEnquiryEmail,
  buildAdminNewOrderEmail,
  buildAdminPendingReminderEmail,
  buildCustomerEnquiryResolvedEmail,
  buildCustomerOrderConfirmationEmail,
  buildCustomerStatusChangeEmail,
  type EnquiryEmailContext,
  type OrderEmailContext,
} from "@/lib/email-templates";
import type { Enquiry } from "@/lib/db/types";
import type { PrintInvoiceData } from "@/lib/print-invoice-html";

const PENDING_STATUSES: OrderStatus[] = ["PLACED", "VERIFYING"];

type OrderWithItems = Order & { items: OrderItem[] };

async function loadOrderForNotification(orderId: string): Promise<OrderWithItems | null> {
  return (await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })) as OrderWithItems | null;
}

function orderToInvoice(order: NonNullable<OrderWithItems>, origin: string): PrintInvoiceData {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    altPhone: order.altPhone,
    email: order.email,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    paymentMethod: order.paymentMethod,
    upiId: order.upiId ?? undefined,
    subtotal: order.subtotal,
    shipping: order.total - order.subtotal,
    total: order.total,
    items: order.items.map((i) => ({
      name: i.name,
      pack: i.pack,
      price: i.price,
      qty: i.qty,
      amount: i.amount,
    })),
    origin,
  };
}

function buildContext(order: NonNullable<OrderWithItems>, origin: string): OrderEmailContext {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
    itemCount: order.items.reduce((s, i) => s + i.qty, 0),
    createdAt: order.createdAt.toISOString(),
    adminOrderUrl: `${origin}/admin/orders/${order.id}`,
    trackUrl: `${origin}/?track=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.phone)}`,
  };
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export async function createAdminNotification(input: {
  type: string;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  enquiryId?: string;
  enquiryNumber?: string;
  /** Deep link for FCM tap (defaults to /admin). */
  targetUrl?: string;
  /** Optional FCM title/body override (bell still uses title/message). */
  pushTitle?: string;
  pushBody?: string;
  /** When true, only create the admin bell entry — skip FCM push. */
  skipPush?: boolean;
}) {
  const { targetUrl, pushTitle, pushBody, skipPush, ...bell } = input;
  await prisma.adminNotification.create({ data: bell });

  if (skipPush) return;

  const origin = resolveSiteOrigin();
  const resolvedTargetUrl = targetUrl ?? `${origin}/admin`;
  const resolvedPushTitle = pushTitle ?? input.title;
  const resolvedPushBody = pushBody ?? input.message;

  try {
    const result = await sendAdminPush({
      title: resolvedPushTitle,
      body: resolvedPushBody,
      targetUrl: resolvedTargetUrl,
      data: {
        type: input.type,
        ...(input.orderId ? { order_id: input.orderId } : {}),
        ...(input.orderNumber ? { order_number: input.orderNumber } : {}),
        ...(input.enquiryId ? { enquiry_id: input.enquiryId } : {}),
        ...(input.enquiryNumber ? { enquiry_number: input.enquiryNumber } : {}),
      },
    });

    await prisma.adminPushLog.create({
      data: {
        type: input.type,
        title: resolvedPushTitle,
        body: resolvedPushBody,
        targetUrl: resolvedTargetUrl,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        enquiryId: input.enquiryId,
        enquiryNumber: input.enquiryNumber,
        status: result.failed > 0 ? (result.sent > 0 ? "PARTIAL" : "FAILED") : "SENT",
        sent: result.sent,
        failed: result.failed,
        removed: result.removed,
        error: result.failures.length
          ? result.failures.map((failure) => `${failure.code}: ${failure.message}`).join("\n")
          : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.adminPushLog.create({
      data: {
        type: input.type,
        title: resolvedPushTitle,
        body: resolvedPushBody,
        targetUrl: resolvedTargetUrl,
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        enquiryId: input.enquiryId,
        enquiryNumber: input.enquiryNumber,
        status: "FAILED",
        error: message,
      },
    });
    console.error("[createAdminNotification] FCM push failed:", error);
  }
}

function buildEnquiryContext(enquiry: Enquiry, origin: string): EnquiryEmailContext {
  return {
    enquiryNumber: enquiry.enquiryNumber,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    message: enquiry.message,
    status: enquiry.status,
    adminNote: enquiry.adminNote,
    createdAt: enquiry.createdAt.toISOString(),
    adminEnquiryUrl: `${origin}/admin/enquiries/${enquiry.id}`,
  };
}

/** Schedule notification work after the HTTP response (Vercel-safe). Never throws to callers. */
export function dispatchNotification(task: () => Promise<void>) {
  const run = () =>
    task().catch((error) => {
      console.error("Notification dispatch failed:", error);
    });

  try {
    after(run);
  } catch {
    void run();
  }
}

/** Send customer confirmation + admin alert when order is finalized. */
export async function notifyOrderPlaced(orderId: string) {
  const order = await loadOrderForNotification(orderId);
  if (!order) return;

  const settings = await getEmailSettings();
  const origin = resolveSiteOrigin();
  const ctx = buildContext(order, origin);
  const adminTo = resolveAdminNotifyEmail(settings);

  if (!settings.enabled) {
    console.warn(
      `[notifyOrderPlaced] Skipped emails for ${order.orderNumber}: email notifications are disabled in admin settings`,
    );
  } else {
    if (settings.notifyCustomerOrderPlaced && order.email?.trim()) {
      try {
        const invoice = orderToInvoice(order, origin);
        const { subject, html } = buildCustomerOrderConfirmationEmail(ctx, invoice);
        const result = await sendEmail({
          to: order.email.trim(),
          subject,
          html,
          trigger: "ORDER_PLACED_CUSTOMER",
          orderId,
        });
        if (!result.ok) {
          console.error(
            `[notifyOrderPlaced] Customer email failed for ${order.orderNumber}:`,
            result.error,
          );
        }
      } catch (error) {
        console.error(`[notifyOrderPlaced] Customer email error for ${order.orderNumber}:`, error);
      }
    }

    if (settings.notifyAdminNewOrder) {
      if (!adminTo) {
        console.warn(
          `[notifyOrderPlaced] Skipped admin email for ${order.orderNumber}: no admin notification email configured`,
        );
      } else {
        try {
          const { subject, html } = buildAdminNewOrderEmail(ctx);
          const result = await sendEmail({
            to: adminTo,
            subject,
            html,
            trigger: "ORDER_PLACED_ADMIN",
            orderId,
          });
          if (!result.ok) {
            console.error(
              `[notifyOrderPlaced] Admin email failed for ${order.orderNumber}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error(`[notifyOrderPlaced] Admin email error for ${order.orderNumber}:`, error);
        }
      }
    }
  }

  const place = order.city?.trim() || order.state?.trim() || "India";
  await createAdminNotification({
    type: "NEW_ORDER",
    title: `New order ${order.orderNumber}`,
    message: `${order.customerName} placed an order for ${formatInr(order.total)} — status: ${ORDER_STATUS_LABEL[order.status]}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    targetUrl: ctx.adminOrderUrl,
    pushTitle: "New Order Received!",
    pushBody: `Order #${order.orderNumber} from ${place} - ${formatInr(order.total)}`,
  });
}

/** Notify customer and optionally admin on status change. */
export async function notifyStatusChange(
  orderId: string,
  previousStatus: OrderStatus,
  note?: string | null,
) {
  const order = await loadOrderForNotification(orderId);
  if (!order || order.status === previousStatus) return;

  const settings = await getEmailSettings();
  const origin = resolveSiteOrigin();
  const ctx = buildContext(order, origin);

  if (settings.enabled) {
    const isDelivered = order.status === "DELIVERED";
    const shouldNotifyCustomer =
      order.email?.trim() &&
      ((isDelivered && settings.notifyCustomerDelivered) ||
        (!isDelivered && settings.notifyCustomerStatusChange));

    if (shouldNotifyCustomer) {
      const { subject, html } = buildCustomerStatusChangeEmail({
        ...ctx,
        previousStatus,
        note,
      });
      await sendEmail({
        to: order.email!.trim(),
        subject,
        html,
        trigger: isDelivered ? "DELIVERED_CUSTOMER" : "STATUS_CHANGE_CUSTOMER",
        orderId,
      });
    }

    // Status-update emails are customer-only. Admin is notified in-app below.
    // (New-order and pending-reminder emails still go to admin separately.)
  }

  const statusLabel = ORDER_STATUS_LABEL[order.status];
  await createAdminNotification({
    type: "STATUS_CHANGE",
    title: `Order ${order.orderNumber} → ${statusLabel}`,
    message:
      note ||
      `Status changed from ${ORDER_STATUS_LABEL[previousStatus]} to ${statusLabel}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    targetUrl: ctx.adminOrderUrl,
    pushTitle: `Order ${order.orderNumber}`,
    pushBody: note?.trim() || `Status → ${statusLabel} · ${formatInr(order.total)}`,
  });
}

/** Remind admin about orders still in PLACED/VERIFYING without status change. */
export async function sendPendingOrderReminders(): Promise<{ reminded: number }> {
  const settings = await getEmailSettings();
  if (!settings.enabled || !settings.notifyAdminPendingReminder) {
    return { reminded: 0 };
  }

  if (!settings.adminNotifyEmail.trim() && !settings.fromEmail.trim() && !settings.username.trim()) {
    return { reminded: 0 };
  }

  const hours = Math.max(1, settings.pendingReminderHours);
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
  const adminTo = resolveAdminNotifyEmail(settings);

  const pending = await prisma.order.findMany({
    where: {
      status: { in: PENDING_STATUSES },
      OR: [
        { lastPendingReminderAt: null, updatedAt: { lte: threshold } },
        { lastPendingReminderAt: { lte: threshold } },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (pending.length === 0) return { reminded: 0 };

  const origin = resolveSiteOrigin();
  const contexts = pending.map((o) => buildContext(o, origin));
  const ordersUrl = `${origin}/admin/orders`;

  let reminded = 0;
  const { subject, html } = buildAdminPendingReminderEmail(contexts, ordersUrl);

  const result = await sendEmail({
    to: adminTo,
    subject,
    html,
    trigger: "PENDING_REMINDER_ADMIN",
  });

  if (!result.ok) return { reminded: 0 };
  reminded = pending.length;

  const now = new Date();
  await prisma.order.updateMany({
    where: { id: { in: pending.map((o) => o.id) } },
    data: { lastPendingReminderAt: now },
  });

  await createAdminNotification({
    type: "PENDING_REMINDER",
    title: `${pending.length} pending order(s) need action`,
    message: "Reminder for orders awaiting verification or confirmation.",
    targetUrl: ordersUrl,
    pushTitle: "Pending orders need action",
    pushBody: `${pending.length} order(s) still awaiting verification.`,
  });

  return { reminded };
}

/**
 * Staff follow-up for incomplete checkouts (PAYMENT_PENDING).
 * Sends per-order admin push + bell with order deep link, every N hours,
 * until the order leaves PAYMENT_PENDING (completed payment or cancelled).
 */
export async function sendIncompleteCheckoutReminders(): Promise<{ reminded: number }> {
  const settings = await getEmailSettings();
  if (!settings.notifyAdminPendingReminder) {
    return { reminded: 0 };
  }

  const hours = Math.max(1, settings.pendingReminderHours);
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

  const incomplete = await prisma.order.findMany({
    where: {
      status: "PAYMENT_PENDING",
      OR: [
        { lastPendingReminderAt: null, updatedAt: { lte: threshold } },
        { lastPendingReminderAt: { lte: threshold } },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (incomplete.length === 0) return { reminded: 0 };

  const origin = resolveSiteOrigin();
  const now = new Date();
  let reminded = 0;

  for (const order of incomplete) {
    const ctx = buildContext(order, origin);
    await createAdminNotification({
      type: "INCOMPLETE_CHECKOUT",
      title: `Incomplete checkout ${order.orderNumber}`,
      message: `Payment not completed — please contact ${order.customerName} (${order.phone}). If not paying, please cancel · ${formatInr(order.total)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      targetUrl: ctx.adminOrderUrl,
      pushTitle: "Payment pending — contact or cancel",
      pushBody: `Order #${order.orderNumber} · ${order.customerName} · ${order.phone} · ${formatInr(order.total)}. If not paying, please cancel.`,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { lastPendingReminderAt: now },
    });
    reminded += 1;
  }

  return { reminded };
}

/** Notify customers when orders are auto-delivered. */
export function notifyAutoDelivered(orderIds: string[]) {
  for (const orderId of orderIds) {
    dispatchNotification(() => notifyStatusChange(orderId, "DISPATCHED"));
  }
}

/** Send admin alert when a new enquiry is submitted. */
export async function notifyEnquiryPlaced(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) return;

  const settings = await getEmailSettings();
  const origin = resolveSiteOrigin();
  const ctx = buildEnquiryContext(enquiry, origin);
  const adminTo = resolveAdminNotifyEmail(settings);

  if (settings.enabled && settings.notifyAdminNewEnquiry) {
    if (!adminTo) {
      console.warn(
        `[notifyEnquiryPlaced] Skipped admin email for ${enquiry.enquiryNumber}: no admin notification email configured`,
      );
    } else {
      try {
        const { subject, html } = buildAdminNewEnquiryEmail(ctx);
        const result = await sendEmail({
          to: adminTo,
          subject,
          html,
          trigger: "ENQUIRY_PLACED_ADMIN",
        });
        if (!result.ok) {
          console.error(
            `[notifyEnquiryPlaced] Admin email failed for ${enquiry.enquiryNumber}:`,
            result.error,
          );
        }
      } catch (error) {
        console.error(`[notifyEnquiryPlaced] Admin email error for ${enquiry.enquiryNumber}:`, error);
      }
    }
  }

  const snippet = enquiry.message.trim().slice(0, 80);
  await createAdminNotification({
    type: "NEW_ENQUIRY",
    title: `New enquiry ${enquiry.enquiryNumber}`,
    message: `${enquiry.name} (${enquiry.phone}) — ${snippet}${enquiry.message.trim().length > 80 ? "…" : ""}`,
    enquiryId: enquiry.id,
    enquiryNumber: enquiry.enquiryNumber,
    targetUrl: ctx.adminEnquiryUrl,
    pushTitle: "New Enquiry Received!",
    pushBody: `${enquiry.name} · ${enquiry.phone} — ${snippet}${enquiry.message.trim().length > 80 ? "…" : ""}`,
  });
}

/** Notify customer when admin marks enquiry as resolved. */
export async function notifyEnquiryResolved(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry || enquiry.status !== "RESOLVED") return;

  const settings = await getEmailSettings();
  const origin = resolveSiteOrigin();
  const ctx = buildEnquiryContext(enquiry, origin);

  if (settings.enabled && settings.notifyCustomerEnquiryResolved && enquiry.email?.trim()) {
    try {
      const { subject, html } = buildCustomerEnquiryResolvedEmail(ctx);
      const result = await sendEmail({
        to: enquiry.email.trim(),
        subject,
        html,
        trigger: "ENQUIRY_RESOLVED_CUSTOMER",
      });
      if (!result.ok) {
        console.error(
          `[notifyEnquiryResolved] Customer email failed for ${enquiry.enquiryNumber}:`,
          result.error,
        );
      }
    } catch (error) {
      console.error(`[notifyEnquiryResolved] Customer email error for ${enquiry.enquiryNumber}:`, error);
    }
  }
}

/** Remind admin about enquiries still pending after N hours. */
export async function sendPendingEnquiryReminders(): Promise<{ reminded: number }> {
  const settings = await getEmailSettings();
  if (!settings.enabled || !settings.notifyAdminEnquiryPendingReminder) {
    return { reminded: 0 };
  }

  if (!settings.adminNotifyEmail.trim() && !settings.fromEmail.trim() && !settings.username.trim()) {
    return { reminded: 0 };
  }

  const hours = Math.max(1, settings.pendingReminderHours);
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
  const adminTo = resolveAdminNotifyEmail(settings);

  const pending = await prisma.enquiry.findMany({
    where: {
      status: "PENDING",
      OR: [
        { lastPendingReminderAt: null, createdAt: { lte: threshold } },
        { lastPendingReminderAt: { lte: threshold } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (pending.length === 0) return { reminded: 0 };

  const origin = resolveSiteOrigin();
  const contexts = pending.map((e) => buildEnquiryContext(e, origin));
  const enquiriesUrl = `${origin}/admin/enquiries`;

  const { subject, html } = buildAdminEnquiryPendingReminderEmail(contexts, enquiriesUrl);
  const result = await sendEmail({
    to: adminTo,
    subject,
    html,
    trigger: "ENQUIRY_PENDING_REMINDER_ADMIN",
  });

  if (!result.ok) return { reminded: 0 };

  const now = new Date();
  await prisma.enquiry.updateMany({
    where: { id: { in: pending.map((e) => e.id) } },
    data: { lastPendingReminderAt: now },
  });

  await createAdminNotification({
    type: "ENQUIRY_PENDING_REMINDER",
    title: `${pending.length} pending enquiry(ies) need action`,
    message: "Reminder for enquiries awaiting resolution for more than 2 hours.",
    targetUrl: enquiriesUrl,
    pushTitle: "Pending enquiries need action",
    pushBody: `${pending.length} enquiry(ies) still awaiting resolution.`,
  });

  return { reminded: pending.length };
}

/** Admin bell + FCM when a verified product review is published. */
export async function notifyNewProductReview(input: {
  reviewId: string;
  productName: string;
  rating: number;
  reviewerName: string;
  orderId: string;
  orderNumber: string;
  text: string;
}) {
  const origin = resolveSiteOrigin();
  const reviewsUrl = `${origin}/admin/reviews`;
  const stars = "★".repeat(Math.min(5, Math.max(1, input.rating)));
  const snippet = input.text.trim().slice(0, 100);

  await createAdminNotification({
    type: "NEW_REVIEW",
    title: `New review · ${input.productName}`,
    message: `${stars} by ${input.reviewerName} (${input.orderNumber}) — ${snippet}${input.text.trim().length > 100 ? "…" : ""}`,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    targetUrl: reviewsUrl,
    pushTitle: "New product review!",
    pushBody: `${stars} ${input.productName} — ${input.reviewerName}. Tap to open Reviews.`,
  });
}
