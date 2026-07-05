"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { BUSINESS } from "@/lib/constants";
import { openPrintInvoice } from "@/lib/print-invoice-html";
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
  createdAt: string;
  customerName: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
  upiId?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  items: OrderItem[];
}

export function OrderActions(props: OrderActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    openPrintInvoice({
      orderNumber: props.orderNumber,
      createdAt: props.createdAt,
      status: props.status,
      customerName: props.customerName,
      phone: props.phone,
      altPhone: props.altPhone,
      email: props.email,
      address: props.address,
      city: props.city,
      state: props.state,
      pincode: props.pincode,
      paymentMethod: props.paymentMethod,
      upiId: props.upiId ?? BUSINESS.upiId,
      subtotal: props.subtotal,
      shipping: props.shipping,
      total: props.total,
      items: props.items,
      origin: window.location.origin,
    });
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

  const deleteOrder = async () => {
    if (
      !confirm(
        `Reset order ${props.orderNumber}? This permanently removes the order and cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${props.orderId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/orders");
        router.refresh();
      }
    } finally {
      setDeleting(false);
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
      <button
        type="button"
        onClick={deleteOrder}
        disabled={deleting}
        className="rounded-lg border border-red/40 bg-red px-3 py-2 text-xs font-semibold text-white hover:bg-red/90 disabled:opacity-50"
      >
        {deleting ? "Resetting..." : "Reset Order"}
      </button>
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
