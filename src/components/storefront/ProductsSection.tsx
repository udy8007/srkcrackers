"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductDTO } from "@/types";
import { OrderOffersBanner } from "./OrderOffersBanner";
import { PriceListButton } from "./PriceListButton";
import { SectionDecor } from "./FestiveDecor";
import { SectionHead } from "./SectionHead";
import { useCatalog } from "./catalog-context";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import { ProductPagination } from "./ProductPagination";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

function scrollToGiftBoxes() {
  document.getElementById("gift-packs")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToProductsGrid() {
  document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ProductsSection() {
  const { categories, cacheProducts, getCategoryLabel, loading: metaLoading } = useCatalog();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const giftPackCategory = useMemo(
    () => categories.find((category) => category.key === "gift-packs"),
    [categories],
  );
  const shopCategories = useMemo(
    () => categories.filter((category) => category.key !== "gift-packs"),
    [categories],
  );
  const totalProducts = useMemo(
    () => shopCategories.reduce((sum, category) => sum + category.productCount, 0),
    [shopCategories],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, debouncedSearch]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        excludeCategory: "gift-packs",
      });
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as {
        products?: ProductDTO[];
        total?: number;
        totalPages?: number;
      };

      const nextProducts = data.products ?? [];
      setProducts(nextProducts);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      cacheProducts(nextProducts);
    } catch (error) {
      console.error("[products] Failed to load page:", error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, debouncedSearch, cacheProducts]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    scrollToProductsGrid();
  };

  const isInitialLoad = (metaLoading || loading) && products.length === 0;

  return (
    <section id="products" className="relative isolate overflow-hidden bg-brandbg px-4 py-14">
      <SectionDecor variant="rockets" />
      <div className="mx-auto max-w-7xl">
        <SectionHead
          title="Shop Crackers by Category"
          subtitle="Clear pricing · Browse categories · Tap + to add"
        />

        <div className="mb-6 flex justify-center">
          <PriceListButton
            label="Download Price List (PDF)"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(157,2,8,0.28)] transition hover:brightness-105"
          />
        </div>

        <OrderOffersBanner />

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#ead6c3] bg-white/95 p-4 shadow-[0_10px_32px_rgba(90,0,8,0.08)] sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow via-primary to-primary-dark" />

          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-ink">Browse categories</p>
              <p className="text-xs text-ink-muted">Choose a category or search for a product</p>
            </div>
            <p className="text-xs font-semibold text-primary">
              {loading ? "Loading…" : `${total} ${total === 1 ? "product" : "products"} found`}
            </p>
          </div>

          <div className="sm:hidden">
            <label htmlFor="product-category" className="sr-only">
              Product category
            </label>
            <div className="relative">
              <select
                id="product-category"
                value={selectedCategory}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "gift-packs") {
                    scrollToGiftBoxes();
                    return;
                  }
                  setSelectedCategory(value);
                }}
                className="w-full appearance-none rounded-xl border border-line bg-brandbg px-4 py-3 pr-10 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">All products ({totalProducts})</option>
                {shopCategories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label} ({category.productCount})
                  </option>
                ))}
                {giftPackCategory && (
                  <option value="gift-packs">
                    Gift Boxes ({giftPackCategory.productCount}) — go to section
                  </option>
                )}
              </select>
              <span
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary"
                aria-hidden
              >
                ▾
              </span>
            </div>
          </div>

          <div className="hidden flex-wrap gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_5px_14px_rgba(157,2,8,0.25)]"
                  : "border border-line bg-brandbg text-ink hover:border-primary/35 hover:bg-primary/[0.04]"
              }`}
            >
              All <span className="ml-1 opacity-75">{totalProducts}</span>
            </button>
            {shopCategories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setSelectedCategory(category.key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === category.key
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_5px_14px_rgba(157,2,8,0.25)]"
                    : "border border-line bg-brandbg text-ink hover:border-primary/35 hover:bg-primary/[0.04]"
                }`}
              >
                {category.label}
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[0.65rem] ${
                    selectedCategory === category.key ? "bg-white/20" : "bg-white text-ink-muted"
                  }`}
                >
                  {category.productCount}
                </span>
              </button>
            ))}
            {giftPackCategory && (
              <button
                type="button"
                onClick={scrollToGiftBoxes}
                className="rounded-xl border border-yellow/70 bg-gradient-to-r from-[#fff4d6] to-[#ffe8b8] px-4 py-2.5 text-sm font-bold text-primary-dark shadow-sm transition hover:brightness-105"
              >
                Gift Boxes
                <span className="ml-2 rounded-full bg-white/80 px-1.5 py-0.5 text-[0.65rem] text-primary">
                  {giftPackCategory.productCount}
                </span>
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-line bg-brandbg px-4 py-3 transition focus-within:border-primary/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
            <span className="text-primary/70" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search crackers by name or pack..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div id="products-grid" className="scroll-mt-28">
          {isInitialLoad ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : products.length > 0 ? (
            <>
              <div
                className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                  loading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryLabel={getCategoryLabel(product.categoryKey)}
                  />
                ))}
              </div>
              <ProductPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </>
          ) : loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : (
            <p className="rounded-2xl border border-dashed border-line bg-white/80 py-12 text-center text-sm text-ink-muted">
              No products found. Try another category or search.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
