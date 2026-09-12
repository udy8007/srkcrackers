"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  feedCacheKey,
  getCachedFeedPage,
  PRODUCT_FEED_PAGE_SIZE,
  setCachedFeedPage,
} from "@/lib/storefront-product-cache";
import type { ProductDTO } from "@/types";

function mergeUnique(existing: ProductDTO[], incoming: ProductDTO[]): ProductDTO[] {
  const ids = new Set(existing.map((product) => product.id));
  return [...existing, ...incoming.filter((product) => !ids.has(product.id))];
}

interface UseProductFeedOptions {
  category: string;
  search: string;
  excludeCategory?: string;
  onProductsLoaded?: (products: ProductDTO[]) => void;
}

export function useProductFeed({
  category,
  search,
  excludeCategory = "gift-packs",
  onProductsLoaded,
}: UseProductFeedOptions) {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const fetchGen = useRef(0);
  const loadingMoreRef = useRef(false);

  const hasMore = page < totalPages;

  const fetchPage = useCallback(
    async (pageNum: number, mode: "replace" | "append") => {
      const key = feedCacheKey({ category, search, page: pageNum, excludeCategory });
      const cached = getCachedFeedPage(key);
      if (cached) {
        if (mode === "replace") setProducts(cached.products);
        else setProducts((prev) => mergeUnique(prev, cached.products));
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        onProductsLoaded?.(cached.products);
        return;
      }

      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(PRODUCT_FEED_PAGE_SIZE),
        excludeCategory,
      });
      if (category !== "all") params.set("category", category);
      if (search) params.set("q", search);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");

      const data = (await res.json()) as {
        products?: ProductDTO[];
        total?: number;
        totalPages?: number;
      };

      const nextProducts = data.products ?? [];
      const nextTotal = data.total ?? 0;
      const nextTotalPages = data.totalPages ?? 1;

      setCachedFeedPage(key, {
        products: nextProducts,
        total: nextTotal,
        totalPages: nextTotalPages,
      });

      if (mode === "replace") setProducts(nextProducts);
      else setProducts((prev) => mergeUnique(prev, nextProducts));
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      onProductsLoaded?.(nextProducts);
    },
    [category, search, excludeCategory, onProductsLoaded],
  );

  useEffect(() => {
    const gen = ++fetchGen.current;
    setPage(1);
    setError(false);
    setLoading(true);

    void (async () => {
      try {
        await fetchPage(1, "replace");
      } catch {
        if (fetchGen.current === gen) setError(true);
      } finally {
        if (fetchGen.current === gen) setLoading(false);
      }
    })();
  }, [category, search, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || page >= totalPages) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      await fetchPage(nextPage, "append");
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, page, totalPages, fetchPage]);

  return {
    products,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  };
}
