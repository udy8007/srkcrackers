"use client";

import { useEffect } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useCatalog } from "./catalog-context";
import { useUI } from "@/store/ui";
import { useCart } from "@/store/cart";
import { formatPrice, discountPercent } from "@/lib/utils";

export function ProductModal() {
  const { getProduct, categories } = useCatalog();
  const productModalId = useUI((s) => s.productModalId);
  const closeProduct = useUI((s) => s.closeProduct);
  const changeQty = useCart((s) => s.changeQty);
  const qty = useCart((s) => (productModalId ? s.items[productModalId] ?? 0 : 0));

  const product = productModalId ? getProduct(productModalId) : undefined;

  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [product]);

  if (!product) return null;

  const categoryLabel = categories.find((c) => c.key === product.categoryKey)?.label ?? "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={closeProduct}
    >
      <div
        className="animate-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-brandbg">
          <button
            type="button"
            onClick={closeProduct}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg text-ink shadow"
          >
            ✕
          </button>
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            width={512}
            height={320}
            className="h-56 w-full object-contain p-4"
          />
        </div>

        <div className="p-5">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-primary/70">
            {categoryLabel}
          </span>
          <h4 className="mt-1 font-display text-xl font-bold text-ink">{product.name}</h4>
          <div className="mt-0.5 text-sm text-ink-muted">{product.pack}</div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-muted line-through">{formatPrice(product.mrp)}</span>
            <span className="text-2xl font-bold text-green">{formatPrice(product.price)}</span>
            <span className="rounded-full bg-red px-2.5 py-1 text-xs font-bold text-white">
              {discountPercent(product.mrp, product.price)}% OFF
            </span>
          </div>

          <div className="mt-4 rounded-lg bg-brandbg p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Product Description
            </div>
            <p className="mt-1.5 text-sm text-ink">{product.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink">Quantity</span>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
                <button
                  type="button"
                  onClick={() => changeQty(product.id, -1)}
                  className="flex h-9 w-9 items-center justify-center bg-brandbg text-lg font-bold text-primary hover:bg-line"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  onClick={() => changeQty(product.id, 1)}
                  className="flex h-9 w-9 items-center justify-center bg-primary text-lg font-bold text-white hover:bg-primary-dark"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-muted">Line Amount</div>
              <strong className="text-lg text-primary">{formatPrice(qty * product.price)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
