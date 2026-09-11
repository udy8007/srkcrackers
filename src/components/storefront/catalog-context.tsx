"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import type { CategoryMetaDTO, ProductDTO } from "@/types";
import { calculateShipping } from "@/lib/utils";

interface CatalogContextValue {
  categories: CategoryMetaDTO[];
  products: ProductDTO[];
  getProduct: (id: string) => ProductDTO | undefined;
  getCategoryLabel: (key: string) => string;
  cacheProducts: (products: ProductDTO[]) => void;
  loading: boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  categories: initialCategories,
  children,
}: {
  categories: CategoryMetaDTO[];
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [productCache, setProductCache] = useState<Map<string, ProductDTO>>(() => new Map());
  const resolvingIds = useRef(new Set<string>());

  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  useEffect(() => {
    if (categories.length > 0) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/products?page=1&pageSize=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { categories?: CategoryMetaDTO[] };
        if (!cancelled && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("[catalog] Failed to refetch category meta:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categories.length]);

  const cacheProducts = useCallback((products: ProductDTO[]) => {
    if (products.length === 0) return;
    setProductCache((current) => {
      const next = new Map(current);
      for (const product of products) {
        next.set(product.id, product);
      }
      return next;
    });
  }, []);

  const resolveMissingProducts = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => !productCache.has(id) && !resolvingIds.current.has(id));
      if (missing.length === 0) return;

      for (const id of missing) resolvingIds.current.add(id);

      try {
        const res = await fetch(`/api/products/resolve?ids=${missing.join(",")}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { products?: ProductDTO[] };
        if (data.products?.length) cacheProducts(data.products);
      } catch (error) {
        console.error("[catalog] Failed to resolve cart products:", error);
      } finally {
        for (const id of missing) resolvingIds.current.delete(id);
      }
    },
    [cacheProducts, productCache],
  );

  const cartItems = useCart((state) => state.items);
  const wishlistIds = useWishlist((state) => state.ids);
  useEffect(() => {
    const cartProductIds = Object.keys(cartItems).filter((id) => cartItems[id] > 0);
    const ids = [...new Set([...cartProductIds, ...wishlistIds])];
    if (ids.length === 0) return;
    void resolveMissingProducts(ids);
  }, [cartItems, wishlistIds, resolveMissingProducts]);

  const value = useMemo<CatalogContextValue>(() => {
    const products = Array.from(productCache.values());
    const categoryLabels = new Map(categories.map((category) => [category.key, category.label]));

    return {
      categories,
      products,
      getProduct: (id: string) => productCache.get(id),
      getCategoryLabel: (key: string) => categoryLabels.get(key) ?? "",
      cacheProducts,
      loading,
    };
  }, [categories, productCache, cacheProducts, loading]);

  const pruneCartInvalid = useCart((s) => s.pruneInvalid);
  const pruneWishlistInvalid = useWishlist((s) => s.pruneInvalid);
  useEffect(() => {
    if (value.products.length === 0) return;
    const validIds = value.products.map((product) => product.id);
    pruneCartInvalid(validIds);
    pruneWishlistInvalid(validIds);
  }, [value.products, pruneCartInvalid, pruneWishlistInvalid]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
}

/** Compute cart totals given the cart item map. */
export function useCartTotals(items: Record<string, number>) {
  const { getProduct } = useCatalog();
  return useMemo(() => {
    let subtotal = 0;
    let count = 0;
    for (const [id, qty] of Object.entries(items)) {
      const product = getProduct(id);
      if (!product) continue;
      subtotal += product.price * qty;
      count += qty;
    }
    const shipping = calculateShipping(subtotal);
    return { subtotal, shipping, total: subtotal + shipping, count };
  }, [items, getProduct]);
}
