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
    <>🎆 Premium Sivakasi Quality Crackers</>,
    <>
      📞 Order Now:{" "}
      <a href={`tel:${BUSINESS.phone}`} className="font-bold underline">
        {BUSINESS.phoneDisplay}
      </a>
    </>,
    <>✅ Licensed Dealer — SRK Crackers, Mogai, Avadi</>,
    <>🚚 Delivery Available — Tamil Nadu &amp; All India</>,
    <>💬 Submit Order via WhatsApp — Quick &amp; Easy!</>,
  ];

  const infoItems: ReactNode[] = [
    <>⚡ Minimum Order — Tamil Nadu &amp; PY: <strong>₹3000</strong></>,
    <>⚡ Other States Minimum Order: <strong>₹5000</strong></>,
    <>🏛️ Govt. Licensed Fireworks Dealer — 100 KGS Capacity</>,
    <>📍 Survey No 280/79, Door No 45, Mogai, Avadi, Tiruvallur</>,
    <>⏰ We confirm your order within 2 hours by phone call</>,
    <>🎁 Best Price — Wholesale Rates Direct from Sivakasi</>,
  ];

  return (
    <>
      <Marquee label="🔥 Offer" items={offerItems} variant="yellow" />
      <Marquee label="📢 Info" items={infoItems} variant="primary" />
    </>
  );
}
