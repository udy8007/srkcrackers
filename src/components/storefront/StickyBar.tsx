"use client";

import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { useMounted } from "@/lib/hooks";
import { useCartTotals } from "./catalog-context";
import { formatPrice, getMinOrderToastMessage, meetsMinOrder } from "@/lib/utils";

export function StickyBar() {
  const items = useCart((s) => s.items);
  const openCheckout = useUI((s) => s.openCheckout);
  const showToast = useToast((s) => s.show);
  const mounted = useMounted();
  const { subtotal, count } = useCartTotals(items);

  const displayTotal = mounted && count > 0 ? subtotal : 0;
  const belowMin = mounted && count > 0 && !meetsMinOrder(subtotal);

  const handlePlaceOrder = () => {
    if (!mounted || count === 0) {
      showToast("Your cart is empty. Add items from the product list first.");
      return;
    }
    if (!meetsMinOrder(subtotal)) {
      showToast(getMinOrderToastMessage(subtotal));
      return;
    }
    openCheckout();
  };

  return (
    <div className="sticky-order-bar fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-yellow px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-sm:flex-col max-sm:text-center sm:pr-4">
      <div className="text-base font-bold text-black">
        Cart Total:{" "}
        <span className="text-[1.35rem] text-primary">{formatPrice(displayTotal)}</span>
      </div>
      <button
        type="button"
        onClick={handlePlaceOrder}
        className={`rounded-[10px] bg-gradient-to-r from-primary-bright via-primary to-primary-dark px-8 py-3 text-base font-bold text-white shadow-[0_4px_16px_rgba(214,40,40,0.45)] transition hover:brightness-110 max-sm:w-full ${belowMin ? "opacity-80" : ""}`}
      >
        Place Order
      </button>
    </div>
  );
}
