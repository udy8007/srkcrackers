"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type EntityFilter =
  | "all"
  | "product"
  | "order"
  | "category"
  | "settings"
  | "account"
  | "system";

interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  items: AuditLogItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Record<string, number>;
}

const ENTITY_LABELS: Record<EntityFilter, string> = {
  all: "All",
  product: "Products",
  order: "Orders",
  category: "Categories",
  settings: "Settings",
  account: "Account",
  system: "System",
};

const ENTITY_STYLES: Record<string, string> = {
  product: "bg-amber-50 text-amber-800",
  order: "bg-blue-50 text-blue-700",
  category: "bg-violet-50 text-violet-700",
  settings: "bg-slate-100 text-slate-700",
  account: "bg-emerald-50 text-emerald-700",
  system: "bg-red/10 text-red",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function actorLabel(item: AuditLogItem) {
  return item.actorName || item.actorEmail || "Unknown";
}

function orderLink(item: AuditLogItem) {
  if (item.entityType !== "order" || !item.entityId) return null;
  return `/admin/orders/${item.entityId}`;
}

export function AuditLogClient() {
  const [entityType, setEntityType] = useState<EntityFilter>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 25;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        entityType,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load audit log.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading audit log.");
    } finally {
      setLoading(false);
    }
  }, [entityType, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRange = useMemo(() => {
    if (!data || data.total === 0) return "0";
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.total, data.page * data.pageSize);
    return `${start}-${end}`;
  }, [data]);

  const changeEntity = (next: EntityFilter) => {
    setEntityType(next);
    setPage(1);
  };

  const resetAll = async () => {
    if (!confirm("Clear all audit log entries? This cannot be undone.")) return;
    setMessage("");
    setResetting(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) {
        setMessage(payload.error ?? "Could not reset audit log.");
        return;
      }
      setMessage(`Reset complete — cleared ${payload.deleted ?? 0} entries.`);
      setPage(1);
      await load();
    } catch {
      setMessage("Network error while resetting audit log.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Audit Log</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Who changed products, orders, settings, and other admin actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-brandbg disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void resetAll()}
            disabled={resetting || loading}
            className="rounded-lg border border-red/30 px-3 py-2 text-sm font-semibold text-red transition hover:bg-red/5 disabled:opacity-50"
          >
            {resetting ? "Resetting..." : "Reset audit log"}
          </button>
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink">{message}</p>
      )}

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ENTITY_LABELS) as EntityFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => changeEntity(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                entityType === key
                  ? "border-primary bg-primary text-white"
                  : "border-line text-ink-muted hover:border-primary hover:text-primary",
              )}
            >
              {ENTITY_LABELS[key]}
              {data?.counts?.[key] != null ? ` (${data.counts[key]})` : ""}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-xs">
          <span className="mb-1 block font-semibold text-ink-muted">Search</span>
          <input
            className="input max-w-md py-1.5"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Summary, actor, action, or entity id…"
          />
        </label>
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
          <p className="p-6 text-sm text-ink-muted">Loading audit log...</p>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">No audit entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Summary</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const link = orderLink(item);
                  const expanded = expandedId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-line/60 align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{actorLabel(item)}</div>
                        {item.actorEmail && item.actorName && (
                          <div className="text-xs text-ink-muted">{item.actorEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.7rem] font-bold uppercase",
                            ENTITY_STYLES[item.entityType] ?? "bg-brandbg text-ink-muted",
                          )}
                        >
                          {item.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-muted">{item.action}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{item.summary}</p>
                        {expanded && item.metadata && (
                          <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-brandbg p-2 text-[0.7rem] text-ink-muted">
                            {item.metadata}
                          </pre>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {item.metadata && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : item.id)}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary"
                            >
                              {expanded ? "Hide" : "Details"}
                            </button>
                          )}
                          {link && (
                            <Link
                              href={link}
                              className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
                            >
                              Open order
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
