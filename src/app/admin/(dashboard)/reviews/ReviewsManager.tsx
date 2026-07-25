"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";

type VisibilityFilter = "all" | "visible" | "hidden";

interface ReviewItem {
  id: string;
  rating: number;
  text: string;
  reviewerName: string;
  visible: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  order: { id: string; orderNumber: string; customerName: string; phone: string };
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
  take: number;
  skip: number;
  counts: { all: number; visible: number; hidden: number };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ReviewsManager() {
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
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
        visibility,
        take: String(pageSize),
        skip: String(page * pageSize),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load reviews.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading reviews.");
    } finally {
      setLoading(false);
    }
  }, [visibility, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  const toggleVisible = async (review: ReviewItem) => {
    setBusyId(review.id);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !review.visible }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not update review.");
        return;
      }
      setMessage(payload.visible ? "Review restored on storefront." : "Review hidden from storefront.");
      await load();
    } catch {
      setError("Network error while updating review.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Product Reviews</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Reviews publish automatically after verified delivery. Hide anything inappropriate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {(["all", "visible", "hidden"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setVisibility(key);
                setPage(0);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 capitalize",
                visibility === key
                  ? "bg-primary text-white"
                  : "border border-line bg-white text-ink-muted hover:border-primary",
              )}
            >
              {key}
              {data ? ` (${data.counts[key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <label className="block text-xs font-semibold text-ink">
          Search reviews
          <input
            className="input mt-1 max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Product, order number, reviewer, or text"
          />
        </label>
      </div>

      {error && <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">{error}</p>}
      {message && (
        <p className="rounded-lg bg-green/10 px-3 py-2 text-sm font-semibold text-green">{message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Loading reviews…</p>
        ) : !data || data.items.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">No reviews found.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((review) => (
              <li key={review.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-yellow">{"★".repeat(review.rating)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase",
                          review.visible
                            ? "bg-green/10 text-green"
                            : "bg-red/10 text-red",
                        )}
                      >
                        {review.visible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">{review.product.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      &ldquo;{review.text}&rdquo;
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                      <span>
                        By <strong className="text-ink">{review.reviewerName}</strong>
                      </span>
                      <span>{formatDate(review.createdAt)}</span>
                      <Link
                        href={`/admin/orders/${review.order.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {review.order.orderNumber}
                      </Link>
                      <span>
                        {review.order.customerName} · {review.order.phone}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === review.id}
                    onClick={() => void toggleVisible(review)}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50",
                      review.visible
                        ? "border border-red/30 bg-red/10 text-red hover:bg-red/15"
                        : "border border-green/30 bg-green/10 text-green hover:bg-green/15",
                    )}
                  >
                    {busyId === review.id
                      ? "Saving…"
                      : review.visible
                        ? "Hide review"
                        : "Restore review"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
