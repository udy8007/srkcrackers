"use client";

import { SafeImage } from "@/components/SafeImage";
import { discountPercent, formatPrice } from "@/lib/utils";

export interface AdminProductView {
  id: string;
  name: string;
  nameTa?: string | null;
  pack: string;
  price: number;
  mrp: number;
  active: boolean;
  imageUrl: string;
  description: string;
  categoryLabel: string;
}

interface ProductPreviewModalProps {
  product: AdminProductView;
  onClose: () => void;
}

/** Storefront-style preview for admin product editing. */
export function ProductPreviewModal({ product, onClose }: ProductPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-bold text-ink">Storefront Preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-brandbg"
          >
            Close
          </button>
        </div>

        {!product.active && (
          <div className="bg-red/10 px-4 py-2 text-center text-sm font-semibold text-red">
            Hidden — customers will not see this product
          </div>
        )}

        <div className="relative bg-brandbg">
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
            {product.categoryLabel}
          </span>
          <h4 className="mt-1 font-display text-xl font-bold text-ink">{product.name || "Untitled product"}</h4>
          {product.nameTa ? (
            <p className="mt-0.5 text-base text-ink/80" lang="ta">
              {product.nameTa}
            </p>
          ) : null}
          <div className="mt-0.5 text-sm text-ink-muted">{product.pack}</div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-muted line-through">{formatPrice(product.mrp)}</span>
            <span className="text-2xl font-bold text-green">{formatPrice(product.price)}</span>
            <span className="rounded-full bg-red px-2.5 py-1 text-xs font-bold text-white">
              {discountPercent(product.mrp, product.price)}% OFF
            </span>
          </div>

          {product.description && (
            <div className="mt-4 rounded-lg bg-brandbg p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</div>
              <p className="mt-1.5 text-sm text-ink">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
