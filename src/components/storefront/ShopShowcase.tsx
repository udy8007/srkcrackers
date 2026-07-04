import Image from "next/image";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";
import { BUSINESS } from "@/lib/constants";

export function ShopShowcase() {
  const coords = `${BUSINESS.lat},${BUSINESS.lng}`;
  return (
    <section id="shop" className="relative isolate overflow-hidden bg-brandbg px-4 py-14">
      <SectionDecor variant="sparklers" />
      <div className="mx-auto max-w-5xl">
        <SectionHead
          title="Visit Our Shop"
          subtitle={`${BUSINESS.name} — Multi Brand Crackers Shop, Morai, Avadi, Chennai`}
        />

        <div className="group overflow-hidden rounded-3xl border-4 border-yellow bg-white shadow-[0_10px_40px_rgba(157,2,8,0.25)]">
          <Image
            src="/shop.png"
            alt={`${BUSINESS.name} shop front — Multi Brand Crackers Shop, Morai, Avadi, Chennai`}
            width={1024}
            height={682}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <p className="max-w-2xl text-sm text-ink-muted sm:text-[0.95rem]">
            Government licensed multi-brand crackers shop offering premium Sivakasi fireworks at
            wholesale prices. Best quality · best price · safe celebrations. Walk in or call us to
            place your order.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${coords}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              📍 Get Directions
            </a>
            <a href={`tel:${BUSINESS.phone}`} className="btn-yellow">
              📞 {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
