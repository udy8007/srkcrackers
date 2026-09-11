import { Fragment, type ReactNode } from "react";
import { BUSINESS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function MarqueeGroup({ items, ariaHidden }: { items: ReactNode[]; ariaHidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, index) => (
        <Fragment key={index}>
          <span className="px-6 text-[0.85rem] whitespace-nowrap">{item}</span>
          <span className="text-yellow/80">★</span>
        </Fragment>
      ))}
    </div>
  );
}

function Marquee({
  label,
  items,
  variant,
}: {
  label: string;
  items: ReactNode[];
  variant: "yellow" | "primary";
}) {
  const isYellow = variant === "yellow";
  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden",
        isYellow ? "bg-yellow text-primary-dark" : "bg-primary text-white",
      )}
    >
      <span
        className={cn(
          "z-10 flex shrink-0 items-center px-3 text-[0.8rem] font-bold shadow-md",
          isYellow ? "bg-primary text-white" : "bg-yellow text-primary-dark",
        )}
      >
        {label}
      </span>
      <div className="flex-1 overflow-hidden py-1.5">
        <div className="marquee-track flex w-max animate-marquee-slow">
          <MarqueeGroup items={items} />
          <MarqueeGroup items={items} ariaHidden />
        </div>
      </div>
    </div>
  );
}

export function MarqueeBars() {
  const offerItems: ReactNode[] = [
    <>🎇 Diwali Special — Flat <strong>80% OFF</strong> on All Crackers!</>,
    <>🎁 Minimum order <strong>₹{BUSINESS.minOrderAmount.toLocaleString("en-IN")}</strong> · All over {BUSINESS.deliveryArea} delivery</>,
    <>🚚 Free delivery above <strong>₹{BUSINESS.freeShippingMinAmount.toLocaleString("en-IN")}</strong> · Delivery ₹{BUSINESS.shippingCost}</>,
    <>🎉 Free <strong>1000 Wala</strong> on orders above ₹{BUSINESS.freeWalaGiftMinAmount.toLocaleString("en-IN")}</>,
    <>🎆 Premium Sivakasi Quality Crackers</>,
    <>
      📞 Order Now:{" "}
      <a href={`tel:${BUSINESS.phone}`} className="font-bold underline">
        {BUSINESS.phoneDisplay}
      </a>
    </>,
    <>✅ Licensed Dealer — SRK Crackers, Morai, Avadi</>,
    <>💬 Submit Order via WhatsApp — Quick &amp; Easy!</>,
  ];

  const infoItems: ReactNode[] = [
    <>🚚 All over {BUSINESS.deliveryArea} — <strong>₹{BUSINESS.shippingCost}</strong> delivery · <strong>FREE</strong> above ₹{BUSINESS.freeShippingMinAmount.toLocaleString("en-IN")}</>,
    <>🎁 Free 1000 Wala gift above ₹{BUSINESS.freeWalaGiftMinAmount.toLocaleString("en-IN")}</>,
    <>🏛️ Govt. Licensed Fireworks Dealer — 25 KGS Capacity</>,
    <>📍 No 45, Sarathi Nagar, Morai Village, Avadi, Chennai - 600055</>,
    <>⏰ We confirm your order within 2 hours by phone call</>,
    <>🏆 {BUSINESS.yearsExperience}+ Years Trusted Fireworks Dealer</>,
  ];

  return (
    <>
      <Marquee label="🔥 Offer" items={offerItems} variant="yellow" />
      <Marquee label="📢 Info" items={infoItems} variant="primary" />
    </>
  );
}
