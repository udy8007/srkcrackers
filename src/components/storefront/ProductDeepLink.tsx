"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "./catalog-context";
import { useUI } from "@/store/ui";
import { scrollToId } from "@/lib/client-actions";
import type { ProductDTO } from "@/types";

/** Opens product modal when URL has ?product=slug */
export function ProductDeepLink() {
  const searchParams = useSearchParams();
  const openProduct = useUI((state) => state.openProduct);
  const { products, cacheProducts } = useCatalog();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const slug = searchParams.get("product")?.trim();
    if (!slug || handled.current === slug) return;

    const openResolved = (product: ProductDTO) => {
      handled.current = slug;
      openProduct(product.id);
      setTimeout(() => scrollToId("products"), 80);

      const url = new URL(window.location.href);
      url.searchParams.delete("product");
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, "", next || "/");
    };

    const cached = products.find((item) => item.slug === slug);
    if (cached) {
      openResolved(cached);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/products/resolve?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { products?: ProductDTO[] };
        const product = data.products?.[0];
        if (!product || cancelled) return;
        cacheProducts([product]);
        openResolved(product);
      } catch (error) {
        console.error("[deep-link] Failed to resolve product:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, products, cacheProducts, openProduct]);

  return null;
}
