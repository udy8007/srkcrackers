"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ENQUIRY_STATUS_LABEL } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

type StatusFilter = "all" | "PENDING" | "RESOLVED";

interface EnquiryItem {
  id: string;
  enquiryNumber: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: "PENDING" | "RESOLVED";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface EnquiriesResponse {
  items: EnquiryItem[];
  total: number;
  take: number;
  skip: number;
  counts: { all: number; PENDING: number; RESOLVED: number };
}

export function EnquiriesManager() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<EnquiriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        status,
        take: String(pageSize),
        skip: String(page * pageSize),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/enquiries?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load enquiries.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading enquiries.");
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Enquiries</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Customer contact enquiries from the storefront. Resolve within 2 hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(["all", "PENDING", "RESOLVED"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setStatus(key);
                setPage(0);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 capitalize",
                status === key
                  ? "bg-primary text-white"
                  : "border border-line bg-white text-ink-muted hover:border-primary",
              )}
            >
              {key === "all" ? "All" : ENQUIRY_STATUS_LABEL[key]}
              {data ? ` (${data.counts[key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <label className="block text-xs font-semibold text-ink">
          Search enquiries
          <input
            className="input mt-1 max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enquiry ID, name, phone, email, or message"
          />
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-brandbg/60 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  Loading enquiries…
                </td>
              </tr>
            ) : !data?.items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No enquiries found.
                </td>
              </tr>
            ) : (
              data.items.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{enquiry.enquiryNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{enquiry.name}</p>
                    <p className="text-xs text-ink-muted">{enquiry.phone}</p>
                    {enquiry.email && <p className="text-xs text-ink-muted">{enquiry.email}</p>}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="line-clamp-2 text-ink-muted">{enquiry.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        enquiry.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800",
                      )}
                    >
                      {ENQUIRY_STATUS_LABEL[enquiry.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {formatDateTime(enquiry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/enquiries/${enquiry.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
