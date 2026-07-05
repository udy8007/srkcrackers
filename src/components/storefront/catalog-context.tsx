"use client";

import { createContext, useContext, useMemo } from "react";
import type { CategoryWithProductsDTO, ProductDTO } from "@/types";
import { calculateShipping } from "@/lib/utils";

interface CatalogContextValue {
  categories: CategoryWithProductsDTO[];
  products: ProductDTO[];
  getProduct: (id: string) => ProductDTO | undefined;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  categories,
  children,
}: {
  categories: CategoryWithProductsDTO[];
  children: React.ReactNode;
}) {
  const value = useMemo<CatalogContextValue>(() => {
    const products = categories.flatMap((category) => category.products);
    const byId = new Map(products.map((product) => [product.id, product]));
    return {
      categories,
      products,
      getProduct: (id: string) => byId.get(id),
    };
  }, [categories]);

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
