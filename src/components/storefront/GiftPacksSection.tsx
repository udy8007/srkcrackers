"use client";

import { useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import type { ProductDTO } from "@/types";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";
import { useCatalog } from "./catalog-context";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { WishlistButton } from "./WishlistButton";

const CARD_ACCENTS = ["#e8a317", "#c45c26", "#9d0208"] as const;

function GiftPackCard({ product, accent }: { product: ProductDTO; accent: string }) {
  const changeQty = useCart((state) => state.changeQty);
  const qty = useCart((state) => state.items[product.id] ?? 0);
  const openProduct = useUI((state) => state.openProduct);
  const mounted = useMounted();
  const shownQty = mounted ? qty : 0;
  const discount =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const inCart = shownQty > 0;

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_8px_28px_rgba(90,0,8,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(90,0,8,0.14)] ${
        inCart ? "border-primary/35 ring-2 ring-primary/15" : "border-[#ead9c8]"
      }`}
      style={{ borderTopWidth: 5, borderTopColor: accent }}
    >
      <div className="absolute right-3 top-3 z-10">
        <WishlistButton productId={product.id} productName={product.name} size="sm" />
      </div>

      <button
        type="button"
        onClick={() => openProduct(product.id)}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff8ef] to-[#ffe9d4] p-3"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={720}
          height={540}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="h-full w-full object-contain drop-shadow-md"
        />
      </button>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="flex flex-1 flex-col text-left transition hover:opacity-90"
        >
          {discount > 0 && (
            <span className="mb-2 inline-flex w-fit rounded-md bg-[#f6e2a8] px-2.5 py-1 text-xs font-extrabold tracking-wide text-[#6b3b00]">
              {discount}% Off
            </span>
          )}

          <span className="font-display text-lg font-bold leading-snug text-[#3a2418] hover:text-primary sm:text-xl">
            {product.name}
          </span>

          <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#6f5648]">
            {product.description || product.pack}
          </span>

          <span className="mt-auto pt-4">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xl font-extrabold text-primary sm:text-2xl">
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-[#8a7366] line-through">{formatPrice(product.mrp)}</span>
            </span>
            <span className="mt-0.5 block text-xs font-medium text-[#8a7366]">/ {product.pack}</span>
          </span>
        </button>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#8a7366]">
            {inCart ? `${shownQty} in cart` : "Add to cart"}
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-full border border-[#e4cbb8] bg-white shadow-sm">
            <button
              type="button"
              aria-label={`Remove ${product.name}`}
              onClick={() => changeQty(product.id, -1)}
              className="flex h-10 w-10 items-center justify-center bg-[#fff4ea] text-xl font-bold text-primary transition hover:bg-primary/10"
            >
              −
            </button>
            <span className="w-9 text-center text-base font-bold tabular-nums text-[#3a2418]">
              {shownQty}
            </span>
            <button
              type="button"
              aria-label={`Add ${product.name}`}
              onClick={() => changeQty(product.id, 1)}
              className="flex h-10 w-10 items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-xl font-bold text-white transition hover:brightness-110"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function GiftPacksSection() {
  const { categories, cacheProducts } = useCatalog();
  const [giftPacks, setGiftPacks] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const giftPackCount = categories.find((category) => category.key === "gift-packs")?.productCount ?? 0;

  useEffect(() => {
    if (giftPackCount === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "24",
          category: "gift-packs",
        });
        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { products?: ProductDTO[] };
        if (!cancelled) {
          const products = data.products ?? [];
          setGiftPacks(products);
          cacheProducts(products);
        }
      } catch (error) {
        console.error("[gift-packs] Failed to load:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [giftPackCount, cacheProducts]);

  if (!loading && giftPacks.length === 0) return null;

  return (
    <section id="gift-packs" className="relative isolate overflow-hidden bg-[#fff8f2] px-4 py-14">
      <SectionDecor variant="chakkars" />
      <div className="mx-auto max-w-6xl">
        <SectionHead
          title="Festival Gift Boxes"
          subtitle="Ready-made collections · Clear pricing · Tap + to add"
        />

        {loading ? (
          <ProductGridSkeleton count={3} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {giftPacks.map((product, index) => (
              <GiftPackCard
                key={product.id}
                product={product}
                accent={CARD_ACCENTS[index % CARD_ACCENTS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
