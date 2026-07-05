"use client";

import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { useMounted } from "@/lib/hooks";
import { BUSINESS } from "@/lib/constants";
import { useCartTotals } from "./catalog-context";
import { formatPrice, meetsMinOrder } from "@/lib/utils";

export function StickyBar() {
  const items = useCart((s) => s.items);
  const openCheckout = useUI((s) => s.openCheckout);
  const showToast = useToast((s) => s.show);
  const mounted = useMounted();
  const { total, count } = useCartTotals(items);

  const disabled = !mounted || count === 0;
  const belowMin = mounted && count > 0 && !meetsMinOrder(total);

  const handlePlaceOrder = () => {
    if (count === 0) return;
    if (!meetsMinOrder(total)) {
      showToast(`Minimum order is ${formatPrice(BUSINESS.minOrder)}. Add more items to continue.`);
      return;
    }
    openCheckout();
  };

  return (
    <div className="sticky-order-bar fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-yellow px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-sm:flex-col max-sm:text-center sm:pr-4">
      <div className="text-base font-bold text-black">
        Grand Total:{" "}
        <span className="text-[1.35rem] text-primary">{formatPrice(mounted ? total : 0)}</span>
      </div>
      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={disabled}
        className="rounded-[10px] bg-gradient-to-r from-primary-bright via-primary to-primary-dark px-8 py-3 text-base font-bold text-white shadow-[0_4px_16px_rgba(214,40,40,0.45)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 max-sm:w-full"
      >
        Place Order
      </button>
      {belowMin && (
        <p className="w-full text-center text-xs font-semibold text-primary-dark sm:text-right">
          Min order {formatPrice(BUSINESS.minOrder)} — add {formatPrice(BUSINESS.minOrder - total)} more
        </p>
      )}
    </div>
  );
}
