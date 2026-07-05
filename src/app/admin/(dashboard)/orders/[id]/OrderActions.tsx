"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { BUSINESS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  name: string;
  pack: string;
  price: number;
  qty: number;
  amount: number;
}

interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: OrderItem[];
}

export function OrderActions(props: OrderActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const summary = buildWhatsAppSummary(props);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const printOrder = () => {
    const html = `
<!DOCTYPE html>
<html><head><title>${props.orderNumber}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f5f5f5; }
  .total { font-size: 1.1rem; font-weight: bold; text-align: right; margin-top: 12px; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${BUSINESS.name} — ${props.orderNumber}</h1>
  <p><strong>${props.customerName}</strong><br>${props.phone}<br>${props.address}, ${props.city}, ${props.state} - ${props.pincode}</p>
  <table>
    <thead><tr><th>Product</th><th>Pack</th><th>Qty</th><th>Amount</th></tr></thead>
    <tbody>
      ${props.items.map((i) => `<tr><td>${i.name}</td><td>${i.pack}</td><td>${i.qty}</td><td>${formatPrice(i.amount)}</td></tr>`).join("")}
    </tbody>
  </table>
  <p style="text-align:right;margin-top:12px;font-size:14px">Subtotal: ${formatPrice(props.subtotal)}</p>
  <p style="text-align:right;margin:4px 0;font-size:14px">Shipping: ${props.shipping > 0 ? formatPrice(props.shipping) : "FREE"}</p>
  <div class="total">Grand Total: ${formatPrice(props.total)}</div>
  <p style="font-size:12px;color:#666;margin-top:24px">${BUSINESS.phoneDisplay} · GST ${BUSINESS.gstin}</p>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const cancelOrder = async () => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", note: "Cancelled by admin" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copySummary} className="btn-outline px-3 py-2 text-xs">
        {copied ? "Copied!" : "Copy for WhatsApp"}
      </button>
      <button type="button" onClick={printOrder} className="btn-outline px-3 py-2 text-xs">
        Print Invoice
      </button>
      {props.status !== "CANCELLED" && props.status !== "DELIVERED" && props.status !== "DISPATCHED" && (
        <button
          type="button"
          onClick={cancelOrder}
          disabled={cancelling}
          className="rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-xs font-semibold text-red hover:bg-red/10 disabled:opacity-50"
        >
          {cancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
    </div>
  );
}

function buildWhatsAppSummary(p: OrderActionsProps) {
  const lines = [
    `*${BUSINESS.name}* — Order ${p.orderNumber}`,
    "",
    `*Customer:* ${p.customerName}`,
    `*Phone:* ${p.phone}`,
    `*Address:* ${p.address}, ${p.city}, ${p.state} - ${p.pincode}`,
    "",
    "*Items:*",
    ...p.items.map((i) => `• ${i.name} (${i.pack}) × ${i.qty} = ${formatPrice(i.amount)}`),
    "",
    `*Subtotal:* ${formatPrice(p.subtotal)}`,
    p.shipping > 0 ? `*Shipping:* ${formatPrice(p.shipping)}` : "*Shipping:* FREE",
    `*Grand Total:* ${formatPrice(p.total)}`,
  ];
  return lines.join("\n");
}
