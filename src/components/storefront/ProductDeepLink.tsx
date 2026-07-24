"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalog } from "./catalog-context";
import { useUI } from "@/store/ui";
import { scrollToId } from "@/lib/client-actions";

/** Opens product modal when URL has ?product=slug */
export function ProductDeepLink() {
  const searchParams = useSearchParams();
  const openProduct = useUI((state) => state.openProduct);
  const { products, loading } = useCatalog();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const slug = searchParams.get("product")?.trim();
    if (!slug || loading || products.length === 0) return;
    if (handled.current === slug) return;

    const product = products.find((item) => item.slug === slug);
    if (!product) return;

    handled.current = slug;
    openProduct(product.id);
    setTimeout(() => scrollToId("products"), 80);

    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next || "/");
  }, [searchParams, products, loading, openProduct]);

  return null;
}
