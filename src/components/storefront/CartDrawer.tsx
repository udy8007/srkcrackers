"use client";

import { useMemo } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useCatalog, useCartTotals } from "./catalog-context";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { scrollToId } from "@/lib/client-actions";
import type { ProductDTO } from "@/types";

function QtyControl({ productId }: { productId: string }) {
  const changeQty = useCart((s) => s.changeQty);
  const qty = useCart((s) => s.items[productId] ?? 0);
  const mounted = useMounted();
  const shown = mounted ? qty : 0;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => changeQty(productId, -1)}
        className="flex h-8 w-8 items-center justify-center bg-brandbg text-lg font-bold text-primary transition hover:bg-line"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-semibold">{shown}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => changeQty(productId, 1)}
        className="flex h-8 w-8 items-center justify-center bg-primary text-lg font-bold text-white transition hover:bg-primary-dark"
      >
        +
      </button>
    </div>
  );
}

function CartLine({ product, qty }: { product: ProductDTO; qty: number }) {
  const remove = useCart((s) => s.remove);
  const openProduct = useUI((s) => s.openProduct);
  const closeCart = useUI((s) => s.closeCart);

  return (
    <li className="flex gap-3 border-b border-line py-3 last:border-0">
      <button
        type="button"
        onClick={() => {
          openProduct(product.id);
          closeCart();
        }}
        className="shrink-0"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-lg object-cover"
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-ink">{product.name}</div>
        <div className="text-xs text-ink-muted">{product.pack}</div>
        <div className="mt-1 text-sm font-bold text-green">{formatPrice(product.price)}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <QtyControl productId={product.id} />
          <button
            type="button"
            onClick={() => remove(product.id)}
            className="text-xs font-semibold text-red hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="shrink-0 text-right text-sm font-bold text-primary">
        {formatPrice(product.price * qty)}
      </div>
    </li>
  );
}

export function CartDrawer() {
  const cartOpen = useUI((s) => s.cartOpen);
  const closeCart = useUI((s) => s.closeCart);
  const openCheckout = useUI((s) => s.openCheckout);
  const items = useCart((s) => s.items);
  const { getProduct } = useCatalog();
  const { total, count } = useCartTotals(items);
  const mounted = useMounted();

  const lines = useMemo(
    () =>
      Object.entries(items)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ product: getProduct(id), qty }))
        .filter((line): line is { product: ProductDTO; qty: number } => !!line.product),
    [items, getProduct],
  );

  if (!cartOpen) return null;

  const handlePlaceOrder = () => {
    if (count === 0) return;
    openCheckout();
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line bg-primary px-4 py-3.5 text-white">
          <div>
            <h2 className="font-display text-lg font-bold">Your Cart</h2>
            <p className="text-xs text-white/80">
              {mounted ? count : 0} item{(mounted ? count : 0) === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {lines.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-ink-muted">Your cart is empty.</p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  scrollToId("products");
                }}
                className="btn-primary mt-4 px-5 py-2 text-sm"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <ul>{lines.map(({ product, qty }) => (
              <CartLine key={product.id} product={product} qty={qty} />
            ))}</ul>
          )}
        </div>

        <div className="border-t border-line bg-brandbg p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-ink">Grand Total</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(mounted ? total : 0)}
            </span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!mounted || count === 0}
            className="w-full rounded-[10px] bg-gradient-to-r from-primary-bright via-primary to-primary-dark py-3.5 text-base font-bold text-white shadow-[0_4px_16px_rgba(214,40,40,0.45)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Place Order
          </button>
        </div>
      </aside>
    </div>
  );
}
