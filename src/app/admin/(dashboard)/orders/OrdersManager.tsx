"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type DatePreset = "" | "today" | "7d" | "30d";

const PAGE_SIZE = 25;

function dateRangeForPreset(preset: DatePreset): { from?: string; to?: string } {
  if (!preset) return {};
  const to = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (preset === "7d") from.setDate(from.getDate() - 6);
  else if (preset === "30d") from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function OrdersManager() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>(() => searchParams.get("status") ?? "");
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("CONFIRMED");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [abandonedCount, setAbandonedCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (query.trim()) params.set("q", query.trim());
      params.set("take", String(PAGE_SIZE));
      params.set("skip", String(page * PAGE_SIZE));
      const range = dateRangeForPreset(datePreset);
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);

      const [ordersRes, overviewRes] = await Promise.all([
        fetch(`/api/admin/orders?${params.toString()}`),
        fetch("/api/admin/overview"),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders);
        setTotal(data.total);
      }
      if (overviewRes.ok) {
        const ov = await overviewRes.json();
        setPendingCount(ov.orders?.pending ?? 0);
        setAbandonedCount(ov.orders?.abandoned ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, query, datePreset, page]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [status, query, datePreset]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  };

  const bulkUpdate = async () => {
    if (!selected.size) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
      });
      if (res.ok) {
        setSelected(new Set());
        load();
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    params.set("take", "500");
    const range = dateRangeForPreset(datePreset);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);

    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    const rows: string[][] = [
      ["Order", "Customer", "Phone", "City", "State", "Items", "Total", "Status", "Date"],
      ...data.orders.map((o: OrderRow) => [
        o.orderNumber,
        o.customerName,
        o.phone,
        o.city,
        o.state,
        String(o.itemCount),
        String(o.total),
        o.status,
        o.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `srk-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickStatus = async (orderId: string, newStatus: OrderStatus) => {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Orders</h1>
          <p className="text-sm text-ink-muted">
            {total} matching · {pendingCount} pending verification
            {abandonedCount > 0 ? ` · ${abandonedCount} incomplete checkout${abandonedCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order id, name, phone..."
          />
          <button type="button" onClick={exportCsv} className="btn-outline px-4 py-2 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip label="All dates" active={datePreset === ""} onClick={() => setDatePreset("")} />
        <FilterChip label="Today" active={datePreset === "today"} onClick={() => setDatePreset("today")} />
        <FilterChip label="7 days" active={datePreset === "7d"} onClick={() => setDatePreset("7d")} />
        <FilterChip label="30 days" active={datePreset === "30d"} onClick={() => setDatePreset("30d")} />
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

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <select
            className="input w-auto py-1.5 text-sm"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={bulkUpdate}
            disabled={bulkBusy}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {bulkBusy ? "Updating..." : "Update status"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-ink-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selected.size === orders.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      aria-label={`Select ${order.orderNumber}`}
                    />
                  </td>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <select
                        className="input max-w-[120px] py-1 text-xs"
                        value={order.status}
                        onChange={(e) => quickStatus(order.id, e.target.value as OrderStatus)}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <a
                        href={`https://wa.me/91${order.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-base hover:bg-brandbg"
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-ink-muted">
                    No orders match your filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-ink-muted">
                    Loading orders...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs text-ink-muted">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
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

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
