import type { ReactNode } from "react";
import { BUSINESS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-7 w-7",
  "aria-hidden": true,
};

const OFFERS = [
  {
    icon: (
      <svg {...iconProps}>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 7H6" />
        <circle cx="9" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </svg>
    ),
    title: "Minimum Order",
    value: formatPrice(BUSINESS.minOrderAmount),
    hint: "Required to place order",
    tone: "from-[#fff0ef] via-white to-[#ffe3df]",
    accent: "bg-primary text-white",
    glow: "bg-primary/10",
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    ),
    title: "Delivery Charge",
    value: formatPrice(BUSINESS.shippingCost),
    hint: `All over ${BUSINESS.deliveryArea}`,
    tone: "from-[#fff8dc] via-white to-[#ffefb6]",
    accent: "bg-[#e79a00] text-white",
    glow: "bg-yellow/20",
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
      </svg>
    ),
    title: "Free Delivery",
    value: `Above ${formatPrice(BUSINESS.freeShippingMinAmount)}`,
    hint: "Zero shipping cost",
    tone: "from-[#eafff0] via-white to-[#d6f6df]",
    accent: "bg-green text-white",
    glow: "bg-green/10",
  },
  {
    icon: (
      <svg {...iconProps}>
        <path d="M3 10h18v11H3z" />
        <path d="M2 6h20v4H2zM12 6v15" />
        <path d="M12 6H8.5A2.5 2.5 0 1 1 11 3.5L12 6Zm0 0h3.5A2.5 2.5 0 1 0 13 3.5L12 6Z" />
      </svg>
    ),
    title: "Free 1000 Wala",
    value: `Above ${formatPrice(BUSINESS.freeWalaGiftMinAmount)}`,
    hint: "Complimentary gift cracker",
    tone: "from-[#fff5dd] via-white to-[#ffe2b6]",
    accent: "bg-[#d86b00] text-white",
    glow: "bg-orange-300/20",
  },
] satisfies ReadonlyArray<{
  icon: ReactNode;
  title: string;
  value: string;
  hint: string;
  tone: string;
  accent: string;
  glow: string;
}>;

/** High-visibility order / delivery offer strip on the price list. */
export function OrderOffersBanner() {
  return (
    <div className="relative mb-7 overflow-hidden rounded-3xl border border-primary/20 bg-[#fffaf5] shadow-[0_18px_50px_rgba(115,10,18,0.14)]">
      <div className="relative isolate overflow-hidden bg-gradient-to-r from-primary-dark via-primary to-[#d91e28] px-5 py-5 text-white sm:px-7 sm:py-6">
        <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full border-[18px] border-white/5" />
        <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-yellow/10 blur-sm" />
        <div className="absolute right-[18%] top-4 text-xl text-yellow/80" aria-hidden>
          ✦
        </div>
        <div className="absolute left-[27%] bottom-2 text-xs text-yellow/60" aria-hidden>
          ✦
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-yellow">
              Celebrate more · Spend smarter
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
              Order &amp; Delivery Offers
            </h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              Simple pricing and exciting rewards on every celebration order.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-300" />
            </span>
            Delivery across {BUSINESS.deliveryArea}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:gap-4 sm:p-5">
        {OFFERS.map((offer) => (
          <div
            key={offer.title}
            className={`group relative isolate overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br p-3.5 text-center shadow-[0_7px_20px_rgba(80,30,10,0.07)] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(80,30,10,0.13)] sm:p-4 ${offer.tone}`}
          >
            <div
              className={`absolute -right-8 -top-8 h-24 w-24 rounded-full transition-transform group-hover:scale-125 ${offer.glow}`}
            />
            <div
              className={`relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_6px_16px_rgba(70,20,10,0.15)] transition group-hover:rotate-3 group-hover:scale-105 ${offer.accent}`}
            >
              {offer.icon}
            </div>
            <p className="relative text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-muted sm:text-[0.68rem]">
              {offer.title}
            </p>
            <p className="relative mt-1 font-display text-base font-extrabold leading-tight text-primary sm:text-lg">
              {offer.value}
            </p>
            <p className="relative mt-1.5 text-[0.65rem] leading-snug text-ink-muted sm:text-xs">
              {offer.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-xl border border-yellow/40 bg-gradient-to-r from-yellow/10 via-white to-yellow/10 px-3 py-3 text-center text-[0.68rem] text-ink sm:mx-5 sm:mb-5 sm:text-xs">
        <span className="text-base" aria-hidden>
          🎉
        </span>
        <span>
          Spend <strong className="text-primary">{formatPrice(BUSINESS.freeWalaGiftMinAmount)}</strong>{" "}
          for a free 1000 Wala · Spend{" "}
          <strong className="text-primary">{formatPrice(BUSINESS.freeShippingMinAmount)}</strong>{" "}
          for free delivery
        </span>
      </div>
    </div>
  );
}
