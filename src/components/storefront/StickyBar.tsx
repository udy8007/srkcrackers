"use client";

import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useMounted } from "@/lib/hooks";
import { useCartTotals } from "./catalog-context";
import { formatPrice } from "@/lib/utils";

export function StickyBar() {
  const items = useCart((s) => s.items);
  const openCheckout = useUI((s) => s.openCheckout);
  const mounted = useMounted();
  const { total, count } = useCartTotals(items);

  const disabled = !mounted || count === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-yellow px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-sm:flex-col max-sm:text-center">
      <div className="text-base font-bold text-black">
        Grand Total:{" "}
        <span className="text-[1.35rem] text-primary">{formatPrice(mounted ? total : 0)}</span>
      </div>
      <button
        type="button"
        onClick={openCheckout}
        disabled={disabled}
        className="rounded-[10px] bg-primary px-8 py-3 text-base font-bold text-white shadow-[0_4px_15px_rgba(168,0,125,0.35)] transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-full"
      >
        Place Order
      </button>
    </div>
  );
}
