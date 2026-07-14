import { BUSINESS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const OFFERS = [
  {
    icon: "🛒",
    title: "Minimum Order",
    value: formatPrice(BUSINESS.minOrderAmount),
    hint: "Required to place order",
    tone: "from-primary/10 to-primary/5 border-primary/20",
  },
  {
    icon: "🚚",
    title: "Delivery Charge",
    value: formatPrice(BUSINESS.shippingCost),
    hint: `All over ${BUSINESS.deliveryArea}`,
    tone: "from-amber-50 to-yellow/20 border-amber-200",
  },
  {
    icon: "✨",
    title: "Free Delivery",
    value: `Above ${formatPrice(BUSINESS.freeShippingMinAmount)}`,
    hint: "Zero shipping cost",
    tone: "from-green/10 to-emerald-50 border-green/25",
  },
  {
    icon: "🎁",
    title: "Free 1000 Wala",
    value: `Above ${formatPrice(BUSINESS.freeWalaGiftMinAmount)}`,
    hint: "Complimentary gift cracker",
    tone: "from-yellow/30 to-orange-50 border-yellow/50",
  },
] as const;

/** High-visibility order / delivery offer strip on the price list. */
export function OrderOffersBanner() {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-primary/20 bg-white shadow-[0_8px_28px_rgba(157,2,8,0.12)]">
      <div className="bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-center">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-yellow sm:text-xs">
          Order &amp; Delivery Offers · All over Chennai
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        {OFFERS.map((offer) => (
          <div
            key={offer.title}
            className={`rounded-xl border bg-gradient-to-br p-3 text-center sm:p-3.5 ${offer.tone}`}
          >
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm sm:h-10 sm:w-10 sm:text-xl">
              {offer.icon}
            </div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted sm:text-[0.7rem]">
              {offer.title}
            </p>
            <p className="mt-0.5 font-display text-base font-bold leading-tight text-primary sm:text-lg">
              {offer.value}
            </p>
            <p className="mt-1 text-[0.65rem] leading-snug text-ink-muted sm:text-xs">{offer.hint}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-line bg-brandbg/80 px-3 py-2.5 text-center text-[0.7rem] text-ink sm:text-xs">
        <span className="font-semibold text-primary">All over Chennai delivery available</span>
        <span className="text-ink-muted">
          {" "}
          · Flat {formatPrice(BUSINESS.shippingCost)} · FREE above{" "}
          {formatPrice(BUSINESS.freeShippingMinAmount)} · Free 1000 Wala above{" "}
          {formatPrice(BUSINESS.freeWalaGiftMinAmount)}
        </span>
      </div>
    </div>
  );
}
