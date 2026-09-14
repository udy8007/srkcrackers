"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/store/toast";
import { downloadPriceList } from "@/lib/pricelist";

interface DownloadProgress {
  message: string;
  percent: number;
}

function PriceListProgressOverlay({ progress }: { progress: DownloadProgress }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-list-progress-title"
      aria-busy="true"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[#ead6c3] bg-white shadow-[0_20px_60px_rgba(90,0,8,0.22)]">
        <div className="h-1.5 bg-gradient-to-r from-yellow via-primary to-primary-dark" />

        <div className="px-6 py-7">
          <div className="mb-5 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 animate-spin text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3v3" strokeLinecap="round" />
                <path d="M12 18v3" strokeLinecap="round" opacity="0.35" />
                <path d="M18.36 5.64l-2.12 2.12" strokeLinecap="round" opacity="0.85" />
                <path d="M7.76 16.24l-2.12 2.12" strokeLinecap="round" opacity="0.2" />
                <path d="M21 12h-3" strokeLinecap="round" opacity="0.65" />
                <path d="M6 12H3" strokeLinecap="round" opacity="0.15" />
                <path d="M18.36 18.36l-2.12-2.12" strokeLinecap="round" opacity="0.5" />
                <path d="M7.76 7.76 5.64 5.64" strokeLinecap="round" opacity="0.95" />
              </svg>
            </div>

            <div className="min-w-0 pt-0.5">
              <p id="price-list-progress-title" className="font-display text-lg font-bold text-ink">
                Preparing Price List
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{progress.message}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink-muted">Progress</span>
              <span className="tabular-nums text-primary">{progress.percent}%</span>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-[#f3e8dc]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              aria-label="Price list download progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-[width] duration-500 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-center text-[0.7rem] font-medium text-ink-muted">
              Please wait — your PDF will download automatically
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function PriceListButton({
  className = "",
  label = "Price List (PDF)",
}: {
  className?: string;
  label?: string;
}) {
  const showToast = useToast((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  const updateProgress = useCallback((message: string, percent: number) => {
    setProgress({ message, percent });
  }, []);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    updateProgress("Loading product catalog...", 10);

    try {
      const res = await fetch("/api/products?full=1");
      if (!res.ok) throw new Error("Failed to load catalog");
      const data = (await res.json()) as { categories?: Parameters<typeof downloadPriceList>[0] };
      if (!data.categories?.length) throw new Error("Catalog empty");

      updateProgress("Catalog loaded. Preparing PDF...", 18);
      await downloadPriceList(data.categories, ({ message, percent }) => {
        updateProgress(message, percent);
      });
    } catch {
      showToast("Could not generate the PDF. Please try again.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <>
      {loading && progress && <PriceListProgressOverlay progress={progress} />}

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="Download price list PDF"
        aria-busy={loading}
        className={`${className} ${loading ? "cursor-wait opacity-70" : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M12 12.5v4.5" />
          <path d="M9.7 14.7 12 17l2.3-2.3" />
        </svg>
        {loading ? "Preparing..." : label}
      </button>
    </>
  );
}
