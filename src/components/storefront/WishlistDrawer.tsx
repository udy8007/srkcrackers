"use client";

import { useMemo } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useCatalog } from "./catalog-context";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { scrollToId } from "@/lib/client-actions";
import { WishlistButton } from "./WishlistButton";
import type { ProductDTO } from "@/types";

function WishlistLine({ product }: { product: ProductDTO }) {
  const changeQty = useCart((state) => state.changeQty);
  const openProduct = useUI((state) => state.openProduct);
  const closeWishlist = useUI((state) => state.closeWishlist);
  const showToast = useToast((state) => state.show);

  return (
    <li className="flex gap-3 border-b border-line py-3 last:border-0">
      <button
        type="button"
        onClick={() => {
          openProduct(product.id);
          closeWishlist();
        }}
        className="shrink-0"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-xl border border-line object-cover"
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-ink">{product.name}</div>
        {product.nameTa ? (
          <div className="text-xs text-ink/75" lang="ta">
            {product.nameTa}
          </div>
        ) : null}
        <div className="text-xs text-ink-muted">{product.pack}</div>
        <div className="mt-1 text-sm font-bold text-primary">{formatPrice(product.price)}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              changeQty(product.id, 1);
              showToast(`Added ${product.name} to cart 🛒`);
            }}
            className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
          >
            Add to cart
          </button>
          <WishlistButton productId={product.id} productName={product.name} size="sm" />
        </div>
      </div>
    </li>
  );
}

export function WishlistDrawer() {
  const wishlistOpen = useUI((state) => state.wishlistOpen);
  const closeWishlist = useUI((state) => state.closeWishlist);
  const openCart = useUI((state) => state.openCart);
  const ids = useWishlist((state) => state.ids);
  const changeQty = useCart((state) => state.changeQty);
  const { getProduct } = useCatalog();
  const showToast = useToast((state) => state.show);
  const mounted = useMounted();

  const products = useMemo(
    () =>
      ids
        .map((id) => getProduct(id))
        .filter((product): product is ProductDTO => !!product),
    [ids, getProduct],
  );

  if (!wishlistOpen) return null;

  const count = mounted ? products.length : 0;

  const handleAddAllToCart = () => {
    if (products.length === 0) {
      showToast("Your wishlist is empty.");
      return;
    }
    for (const product of products) {
      changeQty(product.id, 1);
    }
    showToast(`Added ${products.length} item${products.length === 1 ? "" : "s"} to cart 🛒`);
    closeWishlist();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Wishlist">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close wishlist"
        onClick={closeWishlist}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-primary-dark via-primary to-primary-dark px-4 py-3.5 text-white">
          <div>
            <h2 className="font-display text-lg font-bold">Wishlist ❤️</h2>
            <p className="text-xs text-white/80">
              {count} saved item{count === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeWishlist}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25"
            aria-label="Close wishlist"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl" aria-hidden>
                🤍
              </p>
              <p className="mt-3 font-semibold text-ink">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-ink-muted">
                Tap ❤️ on any product to save it for later.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeWishlist();
                  scrollToId("products");
                }}
                className="btn-primary mt-4 px-5 py-2 text-sm"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <ul>
              {products.map((product) => (
                <WishlistLine key={product.id} product={product} />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line bg-brandbg p-4">
          <button
            type="button"
            onClick={handleAddAllToCart}
            disabled={!mounted || products.length === 0}
            className="w-full rounded-[10px] bg-gradient-to-r from-yellow via-gold to-orange py-3.5 text-base font-bold text-primary-dark shadow-[0_4px_16px_rgba(255,195,0,0.35)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Add all to cart
          </button>
        </div>
      </aside>
    </div>
  );
}
