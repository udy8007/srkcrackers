import type { ReactNode } from "react";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-7 w-7",
  "aria-hidden": true,
  focusable: "false" as const,
};

const FEATURES: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: "Wholesale Rates",
    desc: "Buy in bulk at direct Sivakasi wholesale prices — perfect for groups, resellers & big celebrations.",
    icon: (
      <svg {...svgProps}>
        <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
        <path d="M3 12.5 12 17l9-4.5" />
        <path d="M3 16.5 12 21l9-4.5" />
      </svg>
    ),
  },
  {
    title: "Buy Single / Separate Items",
    desc: "No compulsory box. Pick individual crackers and exact quantities you want — buy even one item.",
    icon: (
      <svg {...svgProps}>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
        <path d="M4 7.5 12 12l8-4.5" />
        <path d="M12 12v9" />
      </svg>
    ),
  },
  {
    title: "Best Price — up to 80% OFF",
    desc: "Factory-direct pricing with huge Diwali discounts. Compare and you will always save more.",
    icon: (
      <svg {...svgProps}>
        <path d="M20.5 13.3 13.3 20.5a2 2 0 0 1-2.8 0l-6.5-6.5a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h4.6a2 2 0 0 1 1.4.6l6.5 6.5a2 2 0 0 1 0 2.8Z" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Premium Sivakasi Quality",
    desc: "Sourced directly from trusted, licensed Sivakasi manufacturers for bright, safe performance.",
    icon: (
      <svg {...svgProps}>
        <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9L12 3Z" />
      </svg>
    ),
  },
  {
    title: "Safe & Fast Delivery",
    desc: "Careful packing and quick delivery across India — FREE postal charge on orders above ₹1000.",
    icon: (
      <svg {...svgProps}>
        <path d="M2.5 6.5h10v9h-10z" />
        <path d="M12.5 9.5h4l3 3v3h-7z" />
        <circle cx="6" cy="17.5" r="1.6" />
        <circle cx="16.5" cy="17.5" r="1.6" />
      </svg>
    ),
  },
  {
    title: "10+ Years Experience",
    desc: "Serving Chennai & Tamil Nadu families for over a decade with trusted service, fair pricing, and repeat customers every festival season.",
    icon: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Govt. Licensed Dealer",
    desc: "100% legal & statutory compliant fireworks dealer — order with complete confidence.",
    icon: (
      <svg {...svgProps}>
        <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />
        <path d="m9 11.5 2 2 4-4" />
      </svg>
    ),
  },
];

export function Highlights() {
  return (
    <section id="why-us" className="relative isolate overflow-hidden bg-white px-4 py-14">
      <SectionDecor variant="bursts" />
      <div className="mx-auto max-w-6xl">
        <SectionHead
          title="Why Buy From SRK Crackers"
          subtitle="Wholesale or single items — buy exactly what you need, at the best price"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 rounded-xl border border-line bg-brandbg p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow via-gold to-orange text-primary-dark shadow-[0_4px_12px_rgba(247,127,0,0.35)]">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-ink">{feature.title}</h4>
                <p className="mt-1 text-sm text-ink-muted">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
