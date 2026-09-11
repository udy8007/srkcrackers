"use client";

import { useState } from "react";
import { useToast } from "@/store/toast";
import { downloadPriceList } from "@/lib/pricelist";

export function PriceListButton({
  className = "",
  label = "Price List (PDF)",
}: {
  className?: string;
  label?: string;
}) {
  const showToast = useToast((s) => s.show);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    showToast("Preparing price list PDF...");
    try {
      const res = await fetch("/api/products?full=1");
      if (!res.ok) throw new Error("Failed to load catalog");
      const data = (await res.json()) as { categories?: Parameters<typeof downloadPriceList>[0] };
      if (!data.categories?.length) throw new Error("Catalog empty");
      await downloadPriceList(data.categories);
    } catch {
      showToast("Could not generate the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label="Download price list PDF"
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
  );
}
