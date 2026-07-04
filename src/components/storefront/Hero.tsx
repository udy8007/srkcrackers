"use client";

import { downloadApk } from "@/lib/client-actions";
import { useToast } from "@/store/toast";
import { BUSINESS } from "@/lib/constants";

export function Hero() {
  const showToast = useToast((state) => state.show);

  return (
    <section id="home" className="border-b-[3px] border-yellow bg-white px-4 py-10 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-bold text-primary">
          Best Crackers Shop — {BUSINESS.name}
        </h2>
        <p className="mx-auto mt-3 max-w-[650px] text-sm text-ink-muted sm:text-[0.95rem]">
          Premium Sivakasi quality crackers from licensed dealer {BUSINESS.name}, Mogai, Avadi.
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
