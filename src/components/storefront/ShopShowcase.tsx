"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { SectionDecor } from "./FestiveDecor";
import { SectionHead } from "./SectionHead";
import { BUSINESS, LICENSE_INFO } from "@/lib/constants";

const SHOP_PHOTOS = [
  { src: "/shop/shop-front.jpg", title: "Shop Front", caption: "SRK Crackers, Morai" },
  { src: "/shop/shop-entrance.jpg", title: "Shop Entrance", caption: "Licensed & safety ready" },
  { src: "/shop/shop-counter.jpg", title: "Inside the Shop", caption: "Walk in and choose" },
  { src: "/shop/shop-stock.jpg", title: "Full Stock", caption: "Ready for the season" },
  { src: "/shop/shop-collection.jpg", title: "Premium Collection", caption: "Sivakasi fireworks" },
  { src: "/shop/shop-shelves.jpg", title: "Festival Specials", caption: "Gift boxes & fancy items" },
] as const;

export function ShopShowcase() {
  const coords = `${BUSINESS.lat},${BUSINESS.lng}`;
  const [activePhoto, setActivePhoto] = useState<(typeof SHOP_PHOTOS)[number] | null>(null);

  useEffect(() => {
    if (!activePhoto) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePhoto(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activePhoto]);

  return (
    <section
      id="shop"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#210307] via-primary-dark to-[#160204] px-4 py-14"
    >
      <SectionDecor variant="sparklers" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_18%_12%,#ffc300_0,transparent_22%),radial-gradient(circle_at_88%_78%,#f77f00_0,transparent_24%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="[&_h3]:text-yellow [&_p]:text-white/75">
          <SectionHead
            title="Visit Our Shop"
            subtitle={`${BUSINESS.name} — Multi Brand Crackers Shop, Morai, Avadi, Chennai`}
          />
        </div>

        <article className="overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-yellow via-orange to-primary p-[3px] shadow-[0_18px_55px_rgba(255,195,0,0.2)] sm:rounded-[1.75rem]">
          <div className="relative overflow-hidden rounded-[calc(1.4rem-3px)] bg-black sm:rounded-[calc(1.75rem-3px)]">
            <div className="relative h-[240px] w-full sm:h-[360px] lg:h-[460px]">
              <Image
                src="/shop/srk-shop-banner.png"
                alt={`${BUSINESS.name} festive shop banner — licensed crackers shop in Morai, Avadi`}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover object-center"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:p-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-yellow sm:text-xs">
                    Licensed Multi Brand Shop
                  </p>
                  <h4 className="mt-1 font-display text-2xl font-extrabold text-white drop-shadow sm:text-4xl">
                    {BUSINESS.name}
                  </h4>
                  <p className="mt-1 text-sm text-white/85 sm:text-base">
                    பட்டாசு கடை · {BUSINESS.street}, {BUSINESS.city}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    Licence {LICENSE_INFO.licenceNo} · GST {BUSINESS.gstin}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-yellow/70 bg-black/40 px-3 py-1 text-xs font-semibold text-yellow">
                    {BUSINESS.yearsExperience}+ Years
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/40 px-3 py-1 text-xs font-semibold text-white">
                    Wholesale & Retail
                  </span>
                  <span className="rounded-full border border-white/25 bg-black/40 px-3 py-1 text-xs font-semibold text-white">
                    {BUSINESS.hours}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-3">
          {SHOP_PHOTOS.map((photo) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setActivePhoto(photo)}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow via-orange to-primary p-[2px] text-left shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-0.5"
            >
              <span className="relative block overflow-hidden rounded-[calc(1rem-2px)] bg-black">
                <span className="relative block aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={`${photo.title} — ${BUSINESS.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <span className="block text-sm font-semibold text-white">{photo.title}</span>
                  <span className="block text-[11px] text-white/70">{photo.caption}</span>
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 sm:text-[0.95rem]">
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
              Get Directions
            </a>
            <a href={`tel:${BUSINESS.phone}`} className="btn-yellow">
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-yellow bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full sm:aspect-video">
              <Image
                src={activePhoto.src}
                alt={`${activePhoto.title} — ${BUSINESS.name}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="font-display text-sm font-semibold text-white sm:text-base">
                {activePhoto.title}
                <span className="ml-2 text-xs font-normal text-white/65">{activePhoto.caption}</span>
              </p>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
