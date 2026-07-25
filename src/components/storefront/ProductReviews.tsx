"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductReviewsResponse } from "@/types";

function Stars({ count, size = "md" }: { count: number; size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  const filled = Math.round(Math.min(5, Math.max(0, count)));
  return (
    <span className={`${cls} text-yellow`} aria-label={`${count} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="text-line">{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ProductReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load reviews.");
        setData(null);
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading reviews.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          phone,
          rating,
          text,
          reviewerName: reviewerName || undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setFormError(payload.error ?? "Could not submit review.");
        return;
      }
      setData({
        summary: payload.summary,
        reviews: payload.reviews,
      });
      setSuccess(payload.message ?? "Thank you! Your review has been published.");
      setOrderNumber("");
      setPhone("");
      setReviewerName("");
      setRating(5);
      setText("");
      setShowForm(false);
    } catch {
      setFormError("Network error while submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary;
  const reviews = data?.reviews ?? [];

  return (
    <div className="rounded-2xl border border-line/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
            Customer reviews
          </p>
          {loading ? (
            <p className="mt-2 text-sm text-ink-muted">Loading reviews…</p>
          ) : summary && summary.count > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Stars count={summary.average} size="lg" />
              <span className="font-display text-2xl font-bold text-primary">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-sm text-ink-muted">
                ({summary.count} review{summary.count === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">No reviews yet for this product.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError("");
            setSuccess("");
          }}
          className="rounded-lg border border-primary bg-yellow px-3 py-2 text-xs font-bold text-primary-dark transition hover:brightness-105"
        >
          {showForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {summary && summary.count > 0 && (
        <div className="mt-4 space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = summary.distribution[star] ?? 0;
            const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="w-8 font-semibold">{star}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow to-orange"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green/10 px-3 py-2 text-sm font-semibold text-green">
          {success}
        </p>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl border border-line bg-brandbg/60 p-3">
          <p className="text-xs leading-relaxed text-ink-muted">
            Verified purchase only — use your delivered Order ID and the mobile number used at
            checkout. Your review is published immediately.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-ink">
              Order ID
              <input
                className="input mt-1"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="SRK-YYYYMMDD-XXXX"
                required
              />
            </label>
            <label className="block text-xs font-semibold text-ink">
              Mobile number
              <input
                className="input mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                required
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-ink">
            Display name (optional)
            <input
              className="input mt-1"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Name shown publicly"
              maxLength={80}
            />
          </label>
          <div>
            <p className="text-xs font-semibold text-ink">Your rating</p>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`text-2xl transition ${
                    value <= rating ? "text-yellow" : "text-line"
                  } hover:scale-110`}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-semibold text-ink">
            Your review
            <textarea
              className="input mt-1 min-h-[90px] resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share how the crackers performed…"
              maxLength={800}
              required
            />
          </label>
          {formError && (
            <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">{formError}</p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? "Publishing…" : "Publish review"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {!loading &&
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-line/80 bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars count={review.rating} size="sm" />
                <span className="rounded-full bg-green/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-green">
                  Verified purchase
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">&ldquo;{review.text}&rdquo;</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                <span className="font-semibold text-ink">{review.reviewerName}</span>
                <span>·</span>
                <span>{formatReviewDate(review.createdAt)}</span>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
