"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import type { CategoryWithProductsDTO, ProductDTO } from "@/types";
import { calculateShipping } from "@/lib/utils";

interface CatalogContextValue {
  categories: CategoryWithProductsDTO[];
  products: ProductDTO[];
  getProduct: (id: string) => ProductDTO | undefined;
  loading: boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  categories: initialCategories,
  children,
}: {
  categories: CategoryWithProductsDTO[];
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  // Keep in sync if the server re-renders with fresh props.
  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  // Recover from intermittent empty SSR / stale empty cache.
  useEffect(() => {
    if (categories.length > 0) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { categories?: CategoryWithProductsDTO[] };
        if (!cancelled && data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("[catalog] Failed to refetch products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categories.length]);

  const value = useMemo<CatalogContextValue>(() => {
    const products = categories.flatMap((category) => category.products);
    const byId = new Map(products.map((product) => [product.id, product]));
    return {
      categories,
      products,
      getProduct: (id: string) => byId.get(id),
      loading,
    };
  }, [categories, loading]);

  const pruneInvalid = useCart((s) => s.pruneInvalid);
  useEffect(() => {
    if (value.products.length === 0) return;
    pruneInvalid(value.products.map((product) => product.id));
  }, [value.products, pruneInvalid]);

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
