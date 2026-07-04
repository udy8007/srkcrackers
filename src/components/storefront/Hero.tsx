"use client";

import { downloadApk } from "@/lib/client-actions";
import { useToast } from "@/store/toast";
import { BUSINESS } from "@/lib/constants";

export function Hero() {
  const showToast = useToast((state) => state.show);

  return (
    <section
      id="home"
      className="hero-festive relative overflow-hidden border-b-[3px] border-yellow px-4 py-14 text-center"
    >
      <div className="pointer-events-none absolute inset-0 select-none text-2xl opacity-40">
        <span className="absolute left-[8%] top-6 animate-pop">🎆</span>
        <span className="absolute right-[10%] top-10 animate-pop">🎇</span>
        <span className="absolute left-[18%] bottom-6 animate-pop">✨</span>
        <span className="absolute right-[16%] bottom-8 animate-pop">🎆</span>
      </div>
      <div className="relative mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow bg-yellow-light px-3 py-1 text-xs font-bold text-primary-dark">
          🎇 Diwali Special — Flat 80% OFF
        </span>
        <h2 className="text-festive mt-4 font-display text-[clamp(1.8rem,4.5vw,2.6rem)] font-extrabold leading-tight">
          Best Crackers Shop — {BUSINESS.name}
        </h2>
        <p className="mx-auto mt-3 max-w-[650px] text-sm text-ink-muted sm:text-[0.95rem]">
          Premium Sivakasi quality crackers from licensed dealer {BUSINESS.name}, Morai, Avadi.
          Select products below, get your estimate and submit order via WhatsApp.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a href="#products" className="btn-primary">
            🛍️ Quick Order
          </a>
          <button
            type="button"
            onClick={() => {
              downloadApk();
              showToast("Downloading SRK Crackers App (demo APK)...");
            }}
            className="btn-yellow"
          >
            📲 Download APK
          </button>
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
