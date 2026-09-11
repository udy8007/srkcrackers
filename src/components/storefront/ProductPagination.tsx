"use client";

import { useMemo } from "react";

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

export function ProductPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  loading = false,
}: ProductPaginationProps) {
  const pages = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const goTo = (nextPage: number) => {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    onPageChange(nextPage);
  };

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-4"
      aria-label="Product pages"
    >
      <p className="text-center text-xs font-medium text-ink-muted sm:text-sm">
        Showing{" "}
        <span className="font-bold text-ink">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="font-bold text-ink">{total}</span> products
      </p>

      <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={loading || page <= 1}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-primary/35 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-45 sm:hidden"
        >
          ← Previous
        </button>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={loading || page <= 1}
            aria-label="Previous page"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-sm font-bold text-ink transition hover:border-primary/35 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex"
          >
            ‹
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {pages.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="hidden px-1 text-sm font-bold text-ink-muted sm:inline"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goTo(item)}
                  disabled={loading}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    item === page
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_5px_14px_rgba(157,2,8,0.25)]"
                      : "border border-line bg-white text-ink hover:border-primary/35 hover:bg-primary/[0.04]"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={loading || page >= totalPages}
            aria-label="Next page"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-sm font-bold text-ink transition hover:border-primary/35 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-45 sm:inline-flex"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={loading || page >= totalPages}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-primary/35 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-45 sm:hidden"
        >
          Next →
        </button>
      </div>

      <p className="text-xs font-semibold text-primary sm:hidden">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}
