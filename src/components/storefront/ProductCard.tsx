"use client";

import { SafeImage } from "@/components/SafeImage";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { WishlistButton } from "./WishlistButton";
import type { ProductDTO } from "@/types";

function discountPct(mrp: number, price: number): number | null {
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;
}

interface ProductCardProps {
  product: ProductDTO;
  categoryLabel?: string;
}

export function ProductCard({ product, categoryLabel }: ProductCardProps) {
  const openProduct = useUI((state) => state.openProduct);
  const changeQty = useCart((state) => state.changeQty);
  const qty = useCart((state) => state.items[product.id] ?? 0);
  const mounted = useMounted();
  const shownQty = mounted ? qty : 0;
  const discount = discountPct(product.mrp, product.price);
  const savings = product.mrp - product.price;
  const inCart = shownQty > 0;

  return (
    <article
      className={`product-card group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white transition duration-300 hover:-translate-y-1.5 ${
        inCart
          ? "product-card--active shadow-[0_16px_40px_rgba(157,2,8,0.18)]"
          : "shadow-[0_8px_28px_rgba(90,0,8,0.09)] hover:shadow-[0_18px_44px_rgba(157,2,8,0.16)]"
      }`}
    >
      <div className="product-card-border pointer-events-none absolute inset-0 rounded-[1.35rem]" aria-hidden />

      <div className="absolute right-3 top-3 z-20">
        <WishlistButton productId={product.id} productName={product.name} size="sm" />
      </div>

      {inCart && (
        <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-md">
          🛒 {shownQty}
        </span>
      )}

      <button
        type="button"
        onClick={() => openProduct(product.id)}
        className="product-card-media relative flex aspect-square w-full items-center justify-center overflow-hidden p-5"
      >
        <div className="product-card-glow pointer-events-none absolute inset-0" aria-hidden />
        <span className="product-card-spark product-card-spark--1 pointer-events-none absolute" aria-hidden>
          ✦
        </span>
        <span className="product-card-spark product-card-spark--2 pointer-events-none absolute" aria-hidden>
          ✨
        </span>
        <span className="product-card-spark product-card-spark--3 pointer-events-none absolute" aria-hidden>
          ✦
        </span>

        {discount && (
          <div className="absolute left-0 top-4 z-10">
            <div className="product-card-ribbon pl-3 pr-4 py-1.5 text-[0.68rem] font-extrabold tracking-wide text-primary-dark shadow-lg">
              {discount}% OFF
            </div>
          </div>
        )}

        {categoryLabel && (
          <span className="absolute bottom-3 left-3 z-10 max-w-[55%] truncate rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-primary backdrop-blur-sm">
            {categoryLabel}
          </span>
        )}

        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 25vw"
          className="relative z-[1] h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(157,2,8,0.15)] transition duration-500 group-hover:scale-[1.06]"
        />

        <div className="product-card-hover-veil absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="rounded-full border border-white/50 bg-ink/70 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md">
            View details ✨
          </span>
        </div>
      </button>

      <div className="relative flex flex-1 flex-col p-4 pt-3">
        <div className="product-card-divider mb-3 h-px w-full" aria-hidden />

        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="flex flex-1 flex-col text-left transition hover:opacity-90"
        >
          <span className="font-display text-[1.02rem] font-bold leading-snug text-ink transition group-hover:text-primary">
            {product.name}
          </span>
          {product.nameTa && (
            <span className="mt-1 line-clamp-1 text-sm text-ink/70" lang="ta">
              {product.nameTa}
            </span>
          )}
          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-brandbg px-2 py-0.5 text-[0.68rem] font-semibold text-ink-muted">
            📦 {product.pack}
          </span>

          <div className="product-card-price mt-4 rounded-xl px-3 py-2.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-extrabold text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
              </div>
              {savings > 0 && (
                <span className="rounded-full bg-green/10 px-2 py-0.5 text-[0.65rem] font-bold text-green">
                  Save {formatPrice(savings)}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/80 pt-3">
          <span className="text-xs font-semibold text-ink-muted">
            {inCart ? `${shownQty} in cart` : "Quantity"}
          </span>
          <div className="product-card-stepper inline-flex items-center overflow-hidden rounded-full shadow-sm">
            <button
              type="button"
              aria-label={`Remove ${product.name}`}
              onClick={() => changeQty(product.id, -1)}
              className="flex h-9 w-9 items-center justify-center bg-[#fff4ea] text-lg font-bold text-primary transition hover:bg-primary/10"
            >
              −
            </button>
            <span className="w-9 bg-white text-center text-sm font-bold tabular-nums text-ink">
              {shownQty}
            </span>
            <button
              type="button"
              aria-label={`Add ${product.name}`}
              onClick={() => changeQty(product.id, 1)}
              className="flex h-9 w-9 items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-lg font-bold text-white transition hover:brightness-110"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
