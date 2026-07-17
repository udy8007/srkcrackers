"use client";

import { BUSINESS } from "@/lib/constants";
import { Diya, MarigoldGarland, Sparkle } from "./FestiveDecor";
import { HeroBrandSpecial, SparklerTrail } from "./HeroFestiveBrand";
import { PriceListButton } from "./PriceListButton";

export function Hero() {
  return (
    <section
      id="home"
      className="hero-festive relative overflow-hidden border-b-[3px] border-yellow px-4 pb-12 pt-14 text-center sm:pb-16 sm:pt-16 lg:pb-20"
    >
      <MarigoldGarland className="absolute inset-x-0 top-0 z-10 px-3" />

      {/* Desktop side graphics — sparklers, not product icons */}
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-[1] hidden w-24 select-none opacity-90 lg:block xl:left-8 xl:w-28"
        aria-hidden
      >
        <SparklerTrail className="h-auto w-full drop-shadow-[0_10px_20px_rgba(157,2,8,0.15)]" />
      </div>
      <div
        className="pointer-events-none absolute bottom-2 right-2 z-[1] hidden w-24 select-none opacity-90 lg:block xl:right-8 xl:w-28"
        aria-hidden
      >
        <div className="hero-bob-mirror">
          <SparklerTrail className="h-auto w-full drop-shadow-[0_10px_20px_rgba(157,2,8,0.15)]" />
        </div>
      </div>

      <Diya className="animate-float pointer-events-none absolute bottom-6 left-[18%] hidden h-10 w-10 opacity-90 lg:block" />
      <Diya
        className="animate-float pointer-events-none absolute bottom-8 right-[18%] hidden h-10 w-10 opacity-90 lg:block"
        style={{ animationDelay: "1.1s" }}
      />

      <Sparkle className="animate-twinkle pointer-events-none absolute left-[12%] top-24 z-[2] h-4 w-4 text-yellow" />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[12%] top-28 z-[2] h-5 w-5 text-orange"
        style={{ animationDelay: "0.8s" }}
      />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute left-[28%] bottom-16 z-[2] hidden h-3.5 w-3.5 text-gold sm:block"
        style={{ animationDelay: "1.3s" }}
      />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[30%] bottom-20 z-[2] hidden h-4 w-4 text-yellow sm:block"
        style={{ animationDelay: "0.4s" }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow bg-yellow-light px-3 py-1 text-xs font-bold text-primary-dark">
            🎇 Diwali Special — Flat 80% OFF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-bold text-primary">
            ⭐ {BUSINESS.yearsExperience}+ Years Experience
          </span>
        </div>

        <HeroBrandSpecial name={BUSINESS.name} />

        <p className="mx-auto mt-4 max-w-[650px] text-sm text-ink-muted sm:text-[0.95rem]">
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
