import type { OrderStatus } from "@/lib/db/types";
import { BUSINESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { buildPrintInvoiceHtml, type PrintInvoiceData } from "@/lib/print-invoice-html";
import { formatPrice } from "@/lib/utils";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout(title: string, bodyHtml: string): string {
  const logoUrl = `${BUSINESS.url}/logo.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    body { margin: 0; padding: 0; background: #f8f4f0; font-family: "Segoe UI", system-ui, sans-serif; color: #2b1f1f; }
    .wrap { max-width: 640px; margin: 24px auto; padding: 0 16px; }
    .card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #ebe1d7; }
    .header { background: linear-gradient(135deg, #9d0208, #d62828); padding: 24px; text-align: center; color: #fff; }
    .header img { width: 56px; height: 56px; border-radius: 50%; background: #fff; padding: 4px; }
    .header h1 { margin: 12px 0 4px; font-size: 22px; }
    .header p { margin: 0; opacity: 0.9; font-size: 13px; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #9d0208; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .meta { background: #fff8f2; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .meta p { margin: 4px 0; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #6e5f5f; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .urgent { background: #fee2e2; border-left-color: #dc2626; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <img src="${esc(logoUrl)}" alt="${esc(BUSINESS.name)}" />
        <h1>${esc(BUSINESS.name)}</h1>
        <p>${esc(BUSINESS.tagline)}</p>
      </div>
      <div class="content">${bodyHtml}</div>
    </div>
    <p class="footer">
      ${esc(BUSINESS.name)} &nbsp;|&nbsp; ${esc(BUSINESS.phoneDisplay)} &nbsp;|&nbsp;
      <a href="${esc(BUSINESS.url)}" style="color:#9d0208">${esc(BUSINESS.url.replace("https://", ""))}</a>
    </p>
  </div>
</body>
</html>`;
}

export interface OrderEmailContext {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string | null;
  status: OrderStatus;
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: string;
  adminOrderUrl: string;
  trackUrl: string;
}

export function buildCustomerOrderConfirmationEmail(
  ctx: OrderEmailContext,
  invoice: PrintInvoiceData,
): { subject: string; html: string } {
  const invoiceHtml = buildPrintInvoiceHtml(invoice);

  const body = `
    <h2 style="margin-top:0;color:#9d0208">Thank you for your order!</h2>
    <p>Dear <strong>${esc(ctx.customerName)}</strong>,</p>
    <p>We have received your order enquiry. Our team will verify your payment and confirm shortly.</p>
    <div class="meta">
      <p><strong>Order ID:</strong> ${esc(ctx.orderNumber)}</p>
      <p><strong>Status:</strong> ${esc(ORDER_STATUS_LABEL[ctx.status])}</p>
      <p><strong>Items:</strong> ${ctx.itemCount}</p>
      <p><strong>Total:</strong> ${formatPrice(ctx.total)}</p>
    </div>
    <p style="text-align:center">
      <a class="btn" href="${esc(ctx.trackUrl)}">Track Your Order</a>
    </p>
    <p>Your invoice is attached below for your records.</p>
    <hr style="border:none;border-top:1px solid #ebe1d7;margin:24px 0" />
    ${invoiceHtml.replace(/<!DOCTYPE html>[\s\S]*?<body>/, "").replace(/<\/body>[\s\S]*/, "")}
  `;

  return {
    subject: `Order Confirmed — ${ctx.orderNumber} | ${BUSINESS.name}`,
    html: emailLayout(`Order ${ctx.orderNumber}`, body),
  };
}

export function buildAdminNewOrderEmail(ctx: OrderEmailContext): { subject: string; html: string } {
  const body = `
    <h2 style="margin-top:0;color:#9d0208">🛎️ New Order Received</h2>
    <div class="alert urgent">
      <strong>Action required:</strong> A new order needs your attention. Please verify payment and update the status.
    </div>
    <div class="meta">
      <p><strong>Order ID:</strong> ${esc(ctx.orderNumber)}</p>
      <p><strong>Customer:</strong> ${esc(ctx.customerName)}</p>
      <p><strong>Phone:</strong> ${esc(ctx.phone)}</p>
      ${ctx.email ? `<p><strong>Email:</strong> ${esc(ctx.email)}</p>` : ""}
      <p><strong>Status:</strong> ${esc(ORDER_STATUS_LABEL[ctx.status])}</p>
      <p><strong>Items:</strong> ${ctx.itemCount}</p>
      <p><strong>Total:</strong> ${formatPrice(ctx.total)}</p>
      <p><strong>Placed:</strong> ${esc(new Date(ctx.createdAt).toLocaleString("en-IN"))}</p>
    </div>
    <p style="text-align:center">
      <a class="btn" href="${esc(ctx.adminOrderUrl)}">View Order in Admin</a>
    </p>
  `;

  return {
    subject: `🔔 New Order ${ctx.orderNumber} — ${formatPrice(ctx.total)}`,
    html: emailLayout(`New Order ${ctx.orderNumber}`, body),
  };
}

export function buildCustomerStatusChangeEmail(
  ctx: OrderEmailContext & { previousStatus: OrderStatus; note?: string | null },
): { subject: string; html: string } {
  const body = `
    <h2 style="margin-top:0;color:#9d0208">Order Status Updated</h2>
    <p>Dear <strong>${esc(ctx.customerName)}</strong>,</p>
    <p>Your order <strong>${esc(ctx.orderNumber)}</strong> status has been updated.</p>
    <div class="meta">
      <p><strong>New Status:</strong> ${esc(ORDER_STATUS_LABEL[ctx.status])}</p>
      ${ctx.note ? `<p><strong>Note:</strong> ${esc(ctx.note)}</p>` : ""}
      <p><strong>Total:</strong> ${formatPrice(ctx.total)}</p>
    </div>
    <p style="text-align:center">
      <a class="btn" href="${esc(ctx.trackUrl)}">Track Your Order</a>
    </p>
  `;

  return {
    subject: `Order ${ctx.orderNumber} — ${ORDER_STATUS_LABEL[ctx.status]}`,
    html: emailLayout(`Status Update ${ctx.orderNumber}`, body),
  };
}

/** Admin-facing status change alert (not the customer copy). */
export function buildAdminStatusChangeEmail(
  ctx: OrderEmailContext & { previousStatus: OrderStatus; note?: string | null },
): { subject: string; html: string } {
  const body = `
    <h2 style="margin-top:0;color:#9d0208">📋 Order Status Changed</h2>
    <div class="alert">
      Order <strong>${esc(ctx.orderNumber)}</strong> moved from
      <strong>${esc(ORDER_STATUS_LABEL[ctx.previousStatus])}</strong> →
      <strong>${esc(ORDER_STATUS_LABEL[ctx.status])}</strong>.
    </div>
    <div class="meta">
      <p><strong>Customer:</strong> ${esc(ctx.customerName)}</p>
      <p><strong>Phone:</strong> ${esc(ctx.phone)}</p>
      ${ctx.email ? `<p><strong>Customer Email:</strong> ${esc(ctx.email)}</p>` : ""}
      <p><strong>Previous Status:</strong> ${esc(ORDER_STATUS_LABEL[ctx.previousStatus])}</p>
      <p><strong>New Status:</strong> ${esc(ORDER_STATUS_LABEL[ctx.status])}</p>
      ${ctx.note ? `<p><strong>Note:</strong> ${esc(ctx.note)}</p>` : ""}
      <p><strong>Items:</strong> ${ctx.itemCount}</p>
      <p><strong>Total:</strong> ${formatPrice(ctx.total)}</p>
    </div>
    <p style="text-align:center">
      <a class="btn" href="${esc(ctx.adminOrderUrl)}">View Order in Admin</a>
    </p>
  `;

  return {
    subject: `[Admin] ${ctx.orderNumber} — ${ORDER_STATUS_LABEL[ctx.previousStatus]} → ${ORDER_STATUS_LABEL[ctx.status]}`,
    html: emailLayout(`Admin Status Update ${ctx.orderNumber}`, body),
  };
}

export function buildAdminPendingReminderEmail(
  orders: OrderEmailContext[],
  adminOrdersUrl: string,
): { subject: string; html: string } {
  const rows = orders
    .map(
      (o) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ebe1d7">${esc(o.orderNumber)}</td>
        <td style="padding:8px;border-bottom:1px solid #ebe1d7">${esc(o.customerName)}</td>
        <td style="padding:8px;border-bottom:1px solid #ebe1d7">${esc(ORDER_STATUS_LABEL[o.status])}</td>
        <td style="padding:8px;border-bottom:1px solid #ebe1d7">${formatPrice(o.total)}</td>
        <td style="padding:8px;border-bottom:1px solid #ebe1d7">
          <a href="${esc(o.adminOrderUrl)}" style="color:#9d0208">View</a>
        </td>
      </tr>`,
    )
    .join("");

  const body = `
    <h2 style="margin-top:0;color:#9d0208">⏰ Pending Orders Reminder</h2>
    <div class="alert urgent">
      <strong>${orders.length} order(s)</strong> are still waiting for action. Status has not changed since the last alert.
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#fff8f2">
          <th style="padding:8px;text-align:left">Order</th>
          <th style="padding:8px;text-align:left">Customer</th>
          <th style="padding:8px;text-align:left">Status</th>
          <th style="padding:8px;text-align:left">Total</th>
          <th style="padding:8px;text-align:left"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:center">
      <a class="btn" href="${esc(adminOrdersUrl)}">Open Orders Dashboard</a>
    </p>
  `;

  return {
    subject: `⏰ Reminder: ${orders.length} pending order(s) need action`,
    html: emailLayout("Pending Orders Reminder", body),
  };
}

export function buildTestEmail(): { subject: string; html: string } {
  const body = `
    <h2 style="margin-top:0;color:#9d0208">Test Email</h2>
    <p>This is a test email from <strong>${esc(BUSINESS.name)}</strong> admin portal.</p>
    <p>If you received this, your SMTP configuration is working correctly.</p>
    <div class="meta">
      <p><strong>Sent at:</strong> ${esc(new Date().toLocaleString("en-IN"))}</p>
    </div>
  `;

  return {
    subject: `Test Email — ${BUSINESS.name}`,
    html: emailLayout("Test Email", body),
  };
}

export function buildDatabaseBackupPreviewEmail(): { subject: string; html: string } {
  const filename = "srkcrackers-db-20260707-0200-ist.json.gz";
  const body = `
    <h2 style="margin-top:0;color:#9d0208">Database Backup</h2>
    <p>Your scheduled database backup for <strong>${esc(BUSINESS.name)}</strong> is attached.</p>
    <div class="meta">
      <p><strong>File:</strong> ${esc(filename)}</p>
      <p><strong>Size:</strong> 1.24 MB</p>
      <p><strong>Exported:</strong> ${esc(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))} IST</p>
      <p><strong>Payment screenshots:</strong> Excluded (smaller file)</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px">
      <thead>
        <tr style="background:#fff4d6">
          <th style="padding:8px;text-align:left">Table</th>
          <th style="padding:8px;text-align:right">Rows</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7">orders</td><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7;text-align:right">42</td></tr>
        <tr><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7">products</td><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7;text-align:right">86</td></tr>
        <tr><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7">categories</td><td style="padding:6px 10px;border-bottom:1px solid #ebe1d7;text-align:right">12</td></tr>
      </tbody>
    </table>
    <p style="font-size:12px;color:#6e5f5f;margin-top:16px">Store this file securely. It contains business and customer data.</p>
  `;

  return {
    subject: `SRK Crackers DB Backup — ${filename}`,
    html: emailLayout("Database Backup", body),
  };
}
