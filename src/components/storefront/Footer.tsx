import { BUSINESS } from "@/lib/constants";
import { NAV_LINKS } from "./nav";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="bg-primary-dark px-4 pt-14 pb-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="font-display text-xl font-bold">{BUSINESS.name}</h4>
            <p className="mt-3 text-sm text-white/80">
              Your trusted licensed fireworks dealer in Mogai, Avadi, Tiruvallur. Premium Sivakasi
              quality crackers at wholesale prices with safe delivery.
            </p>
            <p className="mt-2 text-sm text-white/80">📍 {BUSINESS.addressLine}, Tamil Nadu</p>
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
          © {year} {BUSINESS.name}. All Rights Reserved. | Licensed Fireworks Dealer | Mogai, Avadi,
          Tiruvallur
        </div>
      </div>
    </footer>
  );
}
