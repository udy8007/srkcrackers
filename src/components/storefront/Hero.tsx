"use client";

import { BUSINESS } from "@/lib/constants";
import { MarigoldGarland, Mandala, Diya, Sparkle } from "./FestiveDecor";
import { PriceListButton } from "./PriceListButton";

export function Hero() {
  return (
    <section
      id="home"
      className="hero-festive relative overflow-hidden border-b-[3px] border-yellow px-4 pb-14 pt-16 text-center"
    >
      <MarigoldGarland className="absolute inset-x-0 top-0 px-3" />

      <Mandala className="animate-spin-slow pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 text-primary/15 sm:h-52 sm:w-52" />
      <Mandala className="animate-spin-slow-rev pointer-events-none absolute -right-12 top-10 h-32 w-32 text-orange/20 sm:h-44 sm:w-44" />

      <Diya className="animate-float pointer-events-none absolute bottom-3 left-[6%] h-9 w-9 opacity-90 sm:h-11 sm:w-11" />
      <Diya
        className="animate-float pointer-events-none absolute bottom-4 right-[7%] h-9 w-9 opacity-90 sm:h-11 sm:w-11"
        style={{ animationDelay: "1.2s" }}
      />

      <Sparkle className="animate-twinkle pointer-events-none absolute left-[12%] top-20 h-4 w-4 text-yellow" />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[14%] top-24 h-5 w-5 text-orange"
        style={{ animationDelay: "0.8s" }}
      />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute left-[22%] bottom-16 h-3 w-3 text-gold"
        style={{ animationDelay: "1.5s" }}
      />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[24%] bottom-24 h-4 w-4 text-yellow"
        style={{ animationDelay: "0.4s" }}
      />

      <div className="relative mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow bg-yellow-light px-3 py-1 text-xs font-bold text-primary-dark">
          🎇 Diwali Special — Flat 80% OFF
        </span>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-bold text-primary">
          ⭐ {BUSINESS.yearsExperience}+ Years Experience
        </span>
        <h2 className="text-festive mt-4 font-display text-[clamp(1.8rem,4.5vw,2.6rem)] font-extrabold leading-tight">
          {BUSINESS.name}
        </h2>
        <p className="mx-auto mt-3 max-w-[650px] text-sm text-ink-muted sm:text-[0.95rem]">
          Premium Sivakasi quality crackers from licensed dealer {BUSINESS.name}, Morai, Avadi.
          Select products below, get your estimate and submit order via WhatsApp.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a href="#products" className="btn-primary">
            🛍️ Quick Order
          </a>
          <PriceListButton className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white" />
          <a
            href={`tel:${BUSINESS.phone}`}
            className="hidden items-center justify-center rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:brightness-105 sm:inline-flex"
          >
            📞 {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
