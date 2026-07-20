"use client";

import { BUSINESS } from "@/lib/constants";
import { Diya, MarigoldGarland, Sparkle } from "./FestiveDecor";
import { HeroCastSide, HeroCelebSparks } from "./HeroCelebAnimation";
import { HeroBrandSpecial } from "./HeroFestiveBrand";
import { PriceListButton } from "./PriceListButton";

export function Hero() {
  return (
    <section
      id="home"
      className="hero-festive relative overflow-hidden border-b-[3px] border-yellow px-4 pb-10 pt-0 text-center sm:pb-14 lg:pb-16"
    >
      {/* Garland tight to the top edge */}
      <MarigoldGarland className="relative z-10 mx-auto max-w-6xl px-2 pt-1" />
      <HeroCelebSparks />

      <Diya className="animate-float pointer-events-none absolute bottom-6 left-[18%] hidden h-10 w-10 opacity-90 lg:block" />
      <Diya
        className="animate-float pointer-events-none absolute bottom-8 right-[18%] hidden h-10 w-10 opacity-90 lg:block"
        style={{ animationDelay: "1.1s" }}
      />

      <Sparkle className="animate-twinkle pointer-events-none absolute left-[12%] top-24 z-[2] hidden h-4 w-4 text-yellow sm:block" />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[12%] top-28 z-[2] hidden h-5 w-5 text-orange sm:block"
        style={{ animationDelay: "0.8s" }}
      />

      {/* Small gap under flowers → content centered */}
      <div className="relative z-10 mx-auto mt-2 w-full max-w-6xl sm:mt-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5 px-1 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow bg-yellow-light px-3 py-1 text-xs font-bold text-primary-dark">
            🎇 Diwali Special — Flat 80% OFF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-bold text-primary">
            ⭐ {BUSINESS.yearsExperience}+ Years Experience
          </span>
        </div>

        <div className="hero-same-line mt-2 flex items-center justify-center gap-2 sm:mt-3 sm:gap-3 lg:gap-4">
          <HeroCastSide side="left" />

          <div className="hero-same-line__copy min-w-0 flex-1 px-1">
            <HeroBrandSpecial name={BUSINESS.name} />

            <p className="mx-auto mt-2 max-w-[650px] text-sm text-ink-muted sm:mt-3 sm:text-[0.95rem]">
              Premium Sivakasi quality crackers from licensed dealer {BUSINESS.name}, Morai, Avadi.
              Select products below, get your estimate and submit order via WhatsApp.
            </p>
          </div>

          <HeroCastSide side="right" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 px-1 sm:mt-5">
          <a href="#products" className="btn-primary">
            🛍️ Quick Order
          </a>
          <PriceListButton className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white" />
          <a
            href={`tel:${BUSINESS.phone}`}
            className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:brightness-105"
          >
            📞 {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </section>
  );
}
