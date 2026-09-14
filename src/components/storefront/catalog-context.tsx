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
  addProducts: (products: ProductDTO[]) => void;
  loading: boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  categories: initialCategories,
  products: initialProducts,
  children,
}: {
  categories: CategoryMetaDTO[];
  products: ProductDTO[];
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const resolvingIds = useRef(new Set<string>());

  useEffect(() => {
    setCategories(initialCategories);
    setProducts(initialProducts);
    if (initialCategories.length > 0) setLoading(false);
  }, [initialCategories, initialProducts]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const addProducts = useCallback((incoming: ProductDTO[]) => {
    if (incoming.length === 0) return;
    setProducts((current) => {
      const ids = new Set(current.map((product) => product.id));
      const next = incoming.filter((product) => !ids.has(product.id));
      return next.length > 0 ? [...current, ...next] : current;
    });
  }, []);

  const resolveMissingProducts = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => !productMap.has(id) && !resolvingIds.current.has(id));
      if (missing.length === 0) return;

      for (const id of missing) resolvingIds.current.add(id);

      try {
        const res = await fetch(`/api/products/resolve?ids=${missing.join(",")}`);
        if (!res.ok) return;
        const data = (await res.json()) as { products?: ProductDTO[] };
        if (data.products?.length) addProducts(data.products);
      } catch (error) {
        console.error("[catalog] Failed to resolve cart products:", error);
      } finally {
        for (const id of missing) resolvingIds.current.delete(id);
      }
    },
    [addProducts, productMap],
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
    const categoryLabels = new Map(categories.map((category) => [category.key, category.label]));

    return {
      categories,
      products,
      getProduct: (id: string) => productMap.get(id),
      getCategoryLabel: (key: string) => categoryLabels.get(key) ?? "",
      addProducts,
      loading,
    };
  }, [categories, products, productMap, addProducts, loading]);

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
