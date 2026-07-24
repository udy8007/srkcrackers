import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const TITLE = `1000 Wala Crackers Online | Buy 1000 Wala in Avadi, Chennai | ${BUSINESS.name}`;
const DESCRIPTION = `Buy 1000 Wala crackers online from ${BUSINESS.name}, Avadi, Chennai. Sivakasi-quality 1000 wala / 1000 வாலா garland at wholesale rates. Free 1000 Wala gift on orders above ${formatPrice(BUSINESS.freeWalaGiftMinAmount)}. Order online & pay via UPI.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "1000 wala",
    "1000 wala crackers",
    "1000 wala price",
    "1000 wala online",
    "buy 1000 wala Chennai",
    "1000 wala Avadi",
    "1000 வாலா",
    "wala crackers",
    "garland crackers",
    "Diwali 1000 wala",
  ],
  alternates: {
    canonical: "/1000-wala",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BUSINESS.url}/1000-wala`,
    siteName: BUSINESS.name,
    locale: "en_IN",
    type: "website",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "1000 Wala crackers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.png"],
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where can I buy 1000 Wala crackers in Avadi, Chennai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Buy 1000 Wala crackers online from ${BUSINESS.name}, Morai Village, Avadi, Chennai. Order on ${BUSINESS.url} and pay via UPI.`,
      },
    },
    {
      "@type": "Question",
      name: "Do you give free 1000 Wala on orders?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes. ${BUSINESS.name} gives a complimentary Free 1000 Wala gift on orders above ${formatPrice(BUSINESS.freeWalaGiftMinAmount)}.`,
      },
    },
    {
      "@type": "Question",
      name: "What is the minimum order amount?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Minimum order is ${formatPrice(BUSINESS.minOrderAmount)}. Delivery across ${BUSINESS.deliveryArea} is ${formatPrice(BUSINESS.shippingCost)}, free above ${formatPrice(BUSINESS.freeShippingMinAmount)}.`,
      },
    },
  ],
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "1000 Wala Crackers",
  description: DESCRIPTION,
  brand: { "@type": "Brand", name: BUSINESS.name },
  category: "Fireworks / Garland Crackers",
  offers: {
    "@type": "Offer",
    url: `${BUSINESS.url}/1000-wala`,
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: BUSINESS.name },
  },
};

export default function ThousandWalaPage() {
  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Garland / Wala Crackers
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          1000 Wala Crackers Online — Avadi, Chennai
        </h1>
        <p className="mt-2 text-lg text-ink/80" lang="ta">
          1000 வாலா பட்டாசு — சிவகாசி தரம் · ஆவடி, சென்னை
        </p>

        <p className="mt-5 text-base leading-relaxed text-ink">
          Looking for <strong>1000 Wala</strong> crackers in Chennai? {BUSINESS.name} sells
          premium Sivakasi-quality <strong>1000 wala</strong> garland crackers for Diwali and
          celebrations. Order online from our licensed shop in Morai, Avadi and get delivery all
          over {BUSINESS.deliveryArea}.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Free gift</p>
            <p className="mt-1 font-display text-xl font-bold text-primary">
              Free 1000 Wala above {formatPrice(BUSINESS.freeWalaGiftMinAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Delivery</p>
            <p className="mt-1 font-display text-xl font-bold text-primary">
              {formatPrice(BUSINESS.shippingCost)} · Free above{" "}
              {formatPrice(BUSINESS.freeShippingMinAmount)}
            </p>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">
          Why buy 1000 Wala from {BUSINESS.name}?
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink">
          <li>Government licensed fireworks dealer in Avadi, Chennai</li>
          <li>Sivakasi-quality 1000 Wala / garland crackers at wholesale rates</li>
          <li>Also available: 28 Wala, 100 Wala, 200 Wala, 2000 Wala, 5000 Wala, 10000 Wala</li>
          <li>Festival Gift Boxes with ready-made cracker collections</li>
          <li>Easy online order + UPI payment</li>
        </ul>

        <h2 className="mt-10 font-display text-2xl font-bold text-ink">FAQs</h2>
        <div className="mt-4 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">Is 1000 Wala available for online order?</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Yes. Open the storefront, go to Garland (Wala) category, and add 1000 Wala to cart.
            </p>
          </section>
          <section className="rounded-2xl border border-line bg-white p-4">
            <h3 className="font-semibold text-ink">Do I get free 1000 Wala?</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Orders above {formatPrice(BUSINESS.freeWalaGiftMinAmount)} unlock a complimentary Free
              1000 Wala gift.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/#products"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Order 1000 Wala now
          </Link>
          <Link
            href="/#gift-packs"
            className="inline-flex rounded-full border border-primary/30 bg-white px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/5"
          >
            View Gift Boxes
          </Link>
          <a
            href={`tel:+91${BUSINESS.phone}`}
            className="inline-flex rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink"
          >
            Call {BUSINESS.phoneDisplay}
          </a>
        </div>
      </article>
    </main>
  );
}
