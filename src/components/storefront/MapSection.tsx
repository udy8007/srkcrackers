import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";
import { BUSINESS } from "@/lib/constants";

export function MapSection() {
  const coords = `${BUSINESS.lat},${BUSINESS.lng}`;
  return (
    <section id="map" className="relative isolate overflow-hidden bg-white px-4 py-14">
      <SectionDecor variant="crackers" />
      <div className="mx-auto max-w-5xl">
        <SectionHead
          title="Find Us — Avadi, Chennai"
          subtitle={`${BUSINESS.name} · Morai Village, Avadi, Chennai - 600055, Tamil Nadu`}
        />
        <div className="overflow-hidden rounded-2xl border border-line shadow-sm">
          <iframe
            title={`${BUSINESS.name} — Avadi, Chennai, Tamil Nadu`}
            src={BUSINESS.mapEmbed}
            className="h-[320px] w-full border-0 sm:h-[400px]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-center">
          <div className="text-sm leading-relaxed text-ink">
            <strong className="block text-primary">{BUSINESS.name}</strong>
            📍 <strong>{BUSINESS.mapQuery}</strong>
            <br />
            Govt. Licensed Fireworks Dealer · Licence No 10439/FL/NMSB/2026
            <br />
            📞{" "}
            <a href={`tel:${BUSINESS.phone}`} className="font-bold text-primary">
              {BUSINESS.phoneDisplay}
            </a>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${coords}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              🧭 Get Directions
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${coords}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border-2 border-primary bg-yellow px-5 py-3 text-sm font-bold text-black transition hover:brightness-105"
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
