import { BUSINESS, LICENSE_INFO, ORDER_STATUS_LABEL } from "@/lib/constants";
import { buildUpiQrImageUrl } from "@/lib/pdf-helpers";
import { formatDateTime, formatInvoiceAddressLines, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/types";

export interface PrintInvoiceItem {
  name: string;
  pack: string;
  price: number;
  qty: number;
  amount: number;
}

export interface PrintInvoiceData {
  orderNumber: string;
  createdAt: string | Date;
  status?: OrderStatus;
  customerName: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod?: string;
  upiId?: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: PrintInvoiceItem[];
  /** Site origin for logo URL, e.g. https://www.srkcrackers.in */
  origin: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInvoiceDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SCREEN_TOOLBAR_HTML = `
  <div class="invoice-toolbar">
    <h2>Order Invoice Preview</h2>
    <div class="actions">
      <button type="button" class="btn-back" onclick="window.close()">← Back</button>
      <button type="button" class="btn-print" onclick="window.print()">Print</button>
    </div>
  </div>`;

/** Branded HTML invoice for admin print (matches customer PDF style). */
export function buildPrintInvoiceHtml(
  data: PrintInvoiceData,
  options?: { screenToolbar?: boolean },
): string {
  const statusLabel = data.status ? ORDER_STATUS_LABEL[data.status] : "—";
  const logoUrl = `${data.origin.replace(/\/$/, "")}/logo.png`;
  const qrUrl = buildUpiQrImageUrl(data.total, 140);
  const addressLines = formatInvoiceAddressLines({
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
  });
  const rows = data.items
    .map(
      (item, index) => `
      <tr class="${index % 2 === 1 ? "stripe" : ""}">
        <td class="center">${index + 1}</td>
        <td>${esc(item.name)}</td>
        <td>${esc(item.pack)}</td>
        <td class="center">${item.qty}</td>
        <td class="right">${formatPrice(item.price)}</td>
        <td class="right amount">${formatPrice(item.amount)}</td>
      </tr>`,
    )
    .join("");
  const toolbar = options?.screenToolbar ? SCREEN_TOOLBAR_HTML : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(data.orderNumber)} — ${esc(BUSINESS.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #2b1f1f;
      margin: 0;
      padding: 24px;
      background: #fff;
      font-size: 13px;
      line-height: 1.45;
    }
    .page { max-width: 820px; margin: 0 auto; }
    .header {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .header-main {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      flex: 1;
      min-width: 0;
    }
    .header-qr {
      flex-shrink: 0;
      text-align: center;
    }
    .header-qr img {
      width: 72px;
      height: 72px;
      border-radius: 6px;
      border: 1px solid #ebe1d7;
      background: #fff;
    }
    .header-qr span {
      display: block;
      margin-top: 4px;
      font-size: 9px;
      color: #6e5f5f;
      line-height: 1.35;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .brand-name {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #9d0208;
      letter-spacing: 0.02em;
    }
    .brand-meta {
      margin: 4px 0 0;
      font-size: 11px;
      color: #6e5f5f;
      line-height: 1.5;
    }
    .title-band {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #d62828;
      color: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 12px 0 16px;
      font-weight: 700;
      font-size: 13px;
    }
    .title-band .order-id { font-size: 12px; font-weight: 600; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 18px;
    }
    .info-block h3 {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      color: #9d0208;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .info-block p { margin: 0 0 4px; color: #2b1f1f; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin: 8px 0 16px;
      font-size: 12px;
    }
    col.sno { width: 7%; }
    col.product { width: 34%; }
    col.pack { width: 15%; }
    col.qty { width: 8%; }
    col.rate { width: 16%; }
    col.amount { width: 20%; }
    th {
      background: #9d0208;
      color: #fff;
      font-weight: 700;
      padding: 8px 6px;
      border: 1px solid #8a0207;
      vertical-align: middle;
    }
    th.left { text-align: left; }
    td {
      padding: 7px 6px;
      border: 1px solid #ebe1d7;
      vertical-align: middle;
      word-wrap: break-word;
    }
    tr.stripe td { background: #fff8f2; }
    .center { text-align: center; }
    .left { text-align: left; }
    .right { text-align: right; }
    .amount { font-weight: 700; color: #9d0208; }
    .summary-wrap { display: flex; justify-content: flex-end; margin-top: 4px; }
    .summary {
      background: #fff4d6;
      border-radius: 6px;
      padding: 12px 16px;
      min-width: 220px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin: 0 0 6px;
      font-size: 12px;
      color: #2b1f1f;
    }
    .summary-row.total {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e8d4a8;
      font-size: 15px;
      font-weight: 800;
      color: #9d0208;
    }
    .summary-row .free { color: #15803d; font-weight: 700; }
    .footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #ebe1d7;
      font-size: 11px;
      color: #6e5f5f;
      font-style: italic;
      text-align: center;
    }
    .invoice-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin: -24px -24px 20px;
      padding: 12px 16px;
      background: #9d0208;
      color: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    }
    .invoice-toolbar h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .invoice-toolbar .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .invoice-toolbar button {
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .invoice-toolbar .btn-back { background: #fff; color: #9d0208; }
    .invoice-toolbar .btn-print { background: #fff3c4; color: #7a1a00; }
    @media print {
      body { padding: 0; }
      .page { max-width: none; }
      .invoice-toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  ${toolbar}
  <div class="page">
    <div class="header">
      <div class="header-main">
        <img class="logo" src="${esc(logoUrl)}" alt="${esc(BUSINESS.name)} logo" />
        <div>
          <h1 class="brand-name">${esc(BUSINESS.name.toUpperCase())}</h1>
          <p class="brand-meta">
            Government Licensed Fireworks Dealer &nbsp;|&nbsp; Premium Sivakasi Quality<br />
            ${esc(BUSINESS.addressLine)}, ${esc(BUSINESS.state)}<br />
            Ph: ${esc(BUSINESS.phoneDisplay)} &nbsp;|&nbsp; ${esc(BUSINESS.url.replace("https://", ""))} &nbsp;|&nbsp; GST: ${esc(BUSINESS.gstin)}<br />
            Licence No: ${esc(LICENSE_INFO.licenceNo)}
          </p>
        </div>
      </div>
      <div class="header-qr">
        <img src="${esc(qrUrl)}" alt="UPI payment QR code" />
        <span>Scan to Pay<br />${esc(BUSINESS.upiId)}</span>
      </div>
    </div>

    <div class="title-band">
      <span>ORDER INVOICE</span>
      <span class="order-id">${esc(data.orderNumber)}</span>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h3>Bill To</h3>
        <p><strong>${esc(data.customerName)}</strong></p>
        <p>Mobile: ${esc(data.phone)}</p>
        ${data.altPhone ? `<p>Alt: ${esc(data.altPhone)}</p>` : ""}
        ${data.email ? `<p>Email: ${esc(data.email)}</p>` : ""}
        ${addressLines.map((line) => `<p>${esc(line)}</p>`).join("")}
      </div>
      <div class="info-block">
        <h3>Invoice Details</h3>
        <p>Order ID: <strong>${esc(data.orderNumber)}</strong></p>
        <p>Date: ${esc(formatInvoiceDate(data.createdAt))}</p>
        <p>Status: ${esc(statusLabel)}</p>
        <p>Payment: ${esc(data.paymentMethod ?? "UPI")}</p>
        <p>UPI ID: ${esc(data.upiId ?? BUSINESS.upiId)}</p>
      </div>
    </div>

    <table>
      <colgroup>
        <col class="sno" />
        <col class="product" />
        <col class="pack" />
        <col class="qty" />
        <col class="rate" />
        <col class="amount" />
      </colgroup>
      <thead>
        <tr>
          <th class="center">S.No</th>
          <th class="left">Product</th>
          <th class="left">Pack</th>
          <th class="center">Qty</th>
          <th class="right">Rate</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="summary-wrap">
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(data.subtotal)}</span></div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>${data.shipping > 0 ? formatPrice(data.shipping) : '<span class="free">FREE</span>'}</span>
        </div>
        <div class="summary-row total"><span>Grand Total</span><span>${formatPrice(data.total)}</span></div>
        <div class="summary-row" style="margin-bottom:0;font-size:10px;color:#6e5f5f;justify-content:flex-end">All prices in INR</div>
      </div>
    </div>

    <p class="footer">
      Thank you for choosing ${esc(BUSINESS.name)}! Track your order at ${esc(BUSINESS.url.replace("https://", ""))}
    </p>
  </div>
</body>
</html>`;
}

/** Open branded invoice in a new window with Back/Print controls, then open the print dialog. */
export function openPrintInvoice(data: PrintInvoiceData): void {
  const html = buildPrintInvoiceHtml(data, { screenToolbar: true });
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => win.print();
}
