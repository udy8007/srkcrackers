import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUSINESS } from "@/lib/constants";
import { getGiftPackContents } from "@/lib/gift-pack-contents";
import { getSeoProductBySlug, listActiveSeoProducts, productSeoUrl } from "@/lib/seo-products";
import { discountPercent, formatPrice } from "@/lib/utils";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const products = await listActiveSeoProducts();
    return products.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getSeoProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  const title = `Buy ${product.name} Online | ${product.categoryLabel} | ${BUSINESS.name} Avadi Chennai`;
  const description =
    product.description?.trim() ||
    `Buy ${product.name} (${product.pack}) online from ${BUSINESS.name}, Avadi, Chennai. Offer price ${formatPrice(product.price)}. Order crackers online & pay via UPI.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} price`,
      `${product.name} online`,
      `${product.name} Chennai`,
      `${product.name} Avadi`,
      product.categoryLabel,
      "Sivakasi crackers",
      "buy crackers online",
      BUSINESS.name,
    ],
    alternates: {
      canonical: `/crackers/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: productSeoUrl(product.slug),
      siteName: BUSINESS.name,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: product.imageUrl.startsWith("http") ? product.imageUrl : product.imageUrl,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function CrackerProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getSeoProductBySlug(slug);
  if (!product) notFound();

  const off = discountPercent(product.mrp, product.price);
  const packItems = getGiftPackContents(product.slug);
  const imageSrc = product.imageUrl.startsWith("http") || product.imageUrl.startsWith("data:")
    ? product.imageUrl
    : product.imageUrl;
  const orderHref = `/?product=${encodeURIComponent(product.slug)}#products`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageSrc.startsWith("http") ? imageSrc : `${BUSINESS.url}${imageSrc}`,
    sku: product.slug,
    brand: { "@type": "Brand", name: BUSINESS.name },
    category: product.categoryLabel,
    offers: {
      "@type": "Offer",
      url: productSeoUrl(product.slug),
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: BUSINESS.name,
        url: BUSINESS.url,
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />

      <article className="mx-auto max-w-5xl">
        <nav className="mb-5 text-sm text-ink-muted">
          <Link href="/" className="font-semibold text-primary hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>{product.categoryLabel}</span>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 rounded-3xl border border-line bg-white p-4 shadow-[0_16px_40px_rgba(90,0,8,0.08)] sm:p-8 lg:grid-cols-2">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff9f1] to-[#ffe8d2] p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={`${product.name} crackers for sale online`}
              className="max-h-full max-w-full object-contain"
            />
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-yellow px-3 py-1 text-xs font-extrabold text-primary-dark">
                {off}% OFF
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {product.categoryLabel}
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Buy {product.name} Online
            </h1>
            {product.nameTa ? (
              <p className="mt-1 text-lg text-ink/80" lang="ta">
                {product.nameTa}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-ink-muted">{product.pack}</p>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                  Offer price
                </p>
                <p className="font-display text-4xl font-bold text-green">{formatPrice(product.price)}</p>
              </div>
              <p className="pb-1 text-base text-ink-muted line-through">{formatPrice(product.mrp)}</p>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-ink">
              {product.description ||
                `Order ${product.name} crackers online from ${BUSINESS.name}, a licensed fireworks dealer in Avadi, Chennai.`}
            </p>

            <p className="mt-4 text-sm text-ink-muted">
              Search for <strong>{product.name}</strong>,{" "}
              <strong>{product.name} price</strong>, or{" "}
              <strong>{product.name} Chennai</strong> and order from our official store.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={orderHref}
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
              >
                Order {product.name} now
              </Link>
              <Link
                href="/#products"
                className="inline-flex rounded-full border border-line bg-[#fff8f2] px-6 py-3 text-sm font-bold text-ink"
              >
                Browse all crackers
              </Link>
              <a
                href={`tel:+91${BUSINESS.phone}`}
                className="inline-flex rounded-full border border-line px-6 py-3 text-sm font-bold text-ink"
              >
                Call {BUSINESS.phoneDisplay}
              </a>
            </div>
          </div>
        </div>

        {packItems && packItems.length > 0 && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <div className="border-b border-line bg-[#fff6ea] px-5 py-4">
              <h2 className="font-display text-xl font-bold text-ink">
                {product.name} — pack contents ({packItems.length} items)
              </h2>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#fffaf5] text-[0.65rem] font-bold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-3 py-3">Cracker item</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {packItems.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-t border-line/70">
                      <td className="px-4 py-2.5 font-bold text-primary">{index + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{item.name}</td>
                      <td className="px-4 py-2.5 text-right text-ink-muted">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-ink">
            Why buy {product.name} from {BUSINESS.name}?
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
            <li>Licensed fireworks dealer in Morai, Avadi, Chennai</li>
            <li>Sivakasi-quality crackers with clear MRP and offer price</li>
            <li>
              Free 1000 Wala gift on orders above {formatPrice(BUSINESS.freeWalaGiftMinAmount)}
            </li>
            <li>Delivery across {BUSINESS.deliveryArea}</li>
            <li>Order online and pay securely via UPI</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
