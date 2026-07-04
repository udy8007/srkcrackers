"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  state: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export function OrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      setOrders(data.orders);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Orders</h1>
          <p className="text-sm text-ink-muted">{total} total orders</p>
        </div>
        <input
          className="input max-w-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order id, name, phone..."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label="All" active={status === ""} onClick={() => setStatus("")} />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s.key}
            label={s.label}
            active={status === s.key}
            onClick={() => setStatus(s.key)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-xs text-ink-muted">{order.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {order.city}, {order.state}
                  </td>
                  <td className="px-4 py-3">{order.itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                    No orders match your filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                    Loading orders...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-line bg-white text-ink hover:border-primary hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
