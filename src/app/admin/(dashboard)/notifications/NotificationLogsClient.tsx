"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Channel = "all" | "email" | "push" | "inapp";

interface NotificationLogItem {
  id: string;
  channel: "email" | "push" | "inapp";
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  orderNumber: string | null;
  status: string;
  targetUrl: string | null;
  meta: string;
  error: string | null;
  createdAt: string;
}

interface NotificationLogResponse {
  items: NotificationLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Record<Channel, number>;
}

const CHANNEL_LABELS: Record<Channel, string> = {
  all: "All",
  email: "Email",
  push: "Push",
  inapp: "In-app",
};

const CHANNEL_STYLES: Record<NotificationLogItem["channel"], string> = {
  email: "bg-blue-50 text-blue-700",
  push: "bg-purple-50 text-purple-700",
  inapp: "bg-amber-50 text-amber-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: string) {
  if (["SENT", "READ"].includes(status)) return "bg-green/10 text-green";
  if (["FAILED", "UNREAD"].includes(status)) return "bg-red/10 text-red";
  return "bg-amber-100 text-amber-700";
}

export function NotificationLogsClient() {
  const [channel, setChannel] = useState<Channel>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        channel,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/notification-logs?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load notification logs.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading notification logs.");
    } finally {
      setLoading(false);
    }
  }, [channel, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRange = useMemo(() => {
    if (!data || data.total === 0) return "0";
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.total, data.page * data.pageSize);
    return `${start}-${end}`;
  }, [data]);

  const changeChannel = (next: Channel) => {
    setChannel(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Notification Logs</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Paginated history for push, email, and in-app admin notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-brandbg disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CHANNEL_LABELS) as Channel[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => changeChannel(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                channel === key
                  ? "border-primary bg-primary text-white"
                  : "border-line text-ink-muted hover:border-primary hover:text-primary",
              )}
            >
              {CHANNEL_LABELS[key]}
              {data?.counts?.[key] != null ? ` (${data.counts[key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <p className="text-sm text-ink-muted">
            Showing {visibleRange} of {data?.total ?? 0}
          </p>
          {data && data.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={loading || page <= 1}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-ink-muted">
                Page {data.page} / {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))}
                disabled={loading || page >= data.totalPages}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {error ? (
          <p className="p-4 text-sm text-red">{error}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-ink-muted">Loading notification logs...</p>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">No notification logs found.</p>
        ) : (
          <div className="divide-y divide-line">
            {data.items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.7rem] font-bold uppercase",
                          CHANNEL_STYLES[item.channel],
                        )}
                      >
                        {item.channel === "inapp" ? "In-app" : item.channel}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.7rem] font-bold",
                          statusClass(item.status),
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-ink-muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <h2 className="break-words text-sm font-semibold text-ink">{item.title}</h2>
                    <p className="mt-1 break-words text-sm text-ink-muted">{item.message}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                      <span>{item.type}</span>
                      <span>{item.meta}</span>
                      {item.orderNumber && <span>{item.orderNumber}</span>}
                    </div>
                    {item.error && (
                      <p className="mt-2 rounded-lg bg-red/5 p-2 text-xs text-red">{item.error}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 text-right">
                    {item.orderId && (
                      <Link
                        href={`/admin/orders/${item.orderId}`}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
                      >
                        Open order
                      </Link>
                    )}
                    {item.targetUrl && (
                      <Link
                        href={item.targetUrl}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-primary hover:text-primary"
                      >
                        Open target
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
