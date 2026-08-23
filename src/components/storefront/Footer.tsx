import Image from "next/image";
import { BUSINESS } from "@/lib/constants";
import { NAV_LINKS } from "./nav";
import { SectionDecor } from "./FestiveDecor";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="relative isolate overflow-hidden bg-primary-dark px-4 pt-14 pb-8 text-white">
      <SectionDecor variant="footer" />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt={`${BUSINESS.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full ring-2 ring-yellow/60"
              />
              <h4 className="font-display text-xl font-bold">{BUSINESS.name}</h4>
            </div>
            <p className="mt-3 text-sm text-white/80">
              Your trusted licensed fireworks dealer in Morai, Avadi, Chennai —{" "}
              <strong className="text-yellow">{BUSINESS.yearsExperience}+ years</strong> of
              experience. Premium Sivakasi quality crackers at wholesale prices with safe delivery.
            </p>
            <p className="mt-2 text-sm text-white/80">📍 {BUSINESS.addressLine}, Tamil Nadu</p>
            <p className="mt-2 text-sm text-white/80">🧾 GST No: {BUSINESS.gstin}</p>
          </div>

          <div>
            <h5 className="font-semibold uppercase tracking-wide text-yellow">Quick Links</h5>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV_LINKS.filter((l) => l.href !== "#contact").map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-white/80 transition hover:text-yellow">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold uppercase tracking-wide text-yellow">Contact</h5>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href={`tel:${BUSINESS.phone}`} className="transition hover:text-yellow">
                  📞 {BUSINESS.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${BUSINESS.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-yellow"
                >
                  💬 WhatsApp
                </a>
              </li>
              <li>🕐 {BUSINESS.hours}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-lg bg-white/5 p-4 text-center text-xs leading-relaxed text-white/70">
          As per 2018 Supreme Court Order, online sale of firecrackers is not permitted. Select
          products to see your estimate and submit enquiry. We will contact you within 2 hours to
          confirm your order by phone. {BUSINESS.name} follows 100% legal &amp; statutory compliances.
        </div>

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          © {year} {BUSINESS.name}. All Rights Reserved. | Licensed Fireworks Dealer | Morai, Avadi,
          Chennai
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/70">
          <a
            href="/admin/login"
            className="inline-flex items-center gap-1.5 transition hover:text-yellow"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
              <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
            </svg>
            Admin Portal
          </a>

          <a
            href="https://udy8007.github.io/udyilangovan/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-yellow"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M14 4h6v6" />
              <path d="M20 4 10 14" />
              <path d="M18 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H11" />
            </svg>
            Powered by udyilangovan
          </a>
        </div>
      </div>
    </footer>
  );
}
