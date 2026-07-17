"use client";

import { BUSINESS } from "@/lib/constants";
import { MarigoldGarland, Sparkle } from "./FestiveDecor";
import { HeroBoy, HeroGirl } from "./HeroCelebrationArt";
import { PriceListButton } from "./PriceListButton";

export function Hero() {
  return (
    <section
      id="home"
      className="hero-festive relative overflow-hidden border-b-[3px] border-yellow px-4 pb-10 pt-14 text-center sm:pb-14 sm:pt-16 lg:pb-24"
    >
      <MarigoldGarland className="absolute inset-x-0 top-0 z-10 px-3" />

      {/* Desktop side characters */}
      <div
        className="pointer-events-none absolute bottom-0 left-1 z-[1] hidden w-[min(24vw,240px)] select-none lg:block"
        aria-hidden
      >
        <div className="hero-bob">
          <HeroBoy className="h-auto w-full drop-shadow-[0_14px_26px_rgba(157,2,8,0.16)]" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-0 right-1 z-[1] hidden w-[min(24vw,240px)] select-none lg:block"
        aria-hidden
      >
        <div className="hero-bob-mirror">
          <HeroGirl className="h-auto w-full drop-shadow-[0_14px_26px_rgba(157,2,8,0.16)]" />
        </div>
      </div>

      <Sparkle className="animate-twinkle pointer-events-none absolute left-[10%] top-24 z-[2] hidden h-4 w-4 text-yellow md:block" />
      <Sparkle
        className="animate-twinkle pointer-events-none absolute right-[11%] top-28 z-[2] hidden h-5 w-5 text-orange md:block"
        style={{ animationDelay: "0.8s" }}
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

        {/* Mobile title with small animated boy (left) + girl (right) */}
        <div className="mt-4 inline-flex max-w-full items-center justify-center gap-0 lg:block">
          <div className="hero-bob -mr-0.5 w-12 shrink-0 sm:w-[3.25rem] lg:hidden" aria-hidden>
            <HeroBoy className="h-auto w-full drop-shadow-[0_4px_8px_rgba(157,2,8,0.18)]" />
          </div>
          <h2 className="text-festive relative z-[1] font-display text-[clamp(1.5rem,5.2vw,2.6rem)] font-extrabold leading-none">
            {BUSINESS.name}
          </h2>
          <div className="hero-bob-mirror -ml-0.5 w-12 shrink-0 sm:w-[3.25rem] lg:hidden" aria-hidden>
            <HeroGirl className="h-auto w-full drop-shadow-[0_4px_8px_rgba(157,2,8,0.18)]" />
          </div>
        </div>

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
