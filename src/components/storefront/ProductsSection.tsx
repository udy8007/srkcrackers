"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OrderOffersBanner } from "./OrderOffersBanner";
import { PriceListButton } from "./PriceListButton";
import { SectionDecor } from "./FestiveDecor";
import { SectionHead } from "./SectionHead";
import { useCatalog } from "./catalog-context";
import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";
import { ProductGridSkeleton } from "./ProductCardSkeleton";

const SEARCH_DEBOUNCE_MS = 350;

function scrollToGiftBoxes() {
  document.getElementById("gift-packs")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function matchesSearch(product: { name: string; nameTa: string | null; pack: string; description: string }, query: string) {
  const q = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    (product.nameTa?.toLowerCase().includes(q) ?? false) ||
    product.pack.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q)
  );
}

export function ProductsSection() {
  const { categories, products: allProducts, getCategoryLabel, loading } = useCatalog();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterStuck, setFilterStuck] = useState(false);
  const filterAnchorRef = useRef<HTMLDivElement>(null);

  const shopProducts = useMemo(
    () => allProducts.filter((product) => product.categoryKey !== "gift-packs"),
    [allProducts],
  );

  const products = useMemo(() => {
    let list = shopProducts;
    if (selectedCategory !== "all") {
      list = list.filter((product) => product.categoryKey === selectedCategory);
    }
    if (debouncedSearch) {
      list = list.filter((product) => matchesSearch(product, debouncedSearch));
    }
    return list;
  }, [shopProducts, selectedCategory, debouncedSearch]);

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
    const section = document.getElementById("products");
    const anchor = filterAnchorRef.current;
    if (!section || !anchor) return;

    const updateFloating = () => {
      const headerHeight =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
        ) || 56;
      const grid = document.getElementById("products-grid");
      const anchorRect = anchor.getBoundingClientRect();
      const gridRect = grid?.getBoundingClientRect();
      const scrolledPastFilter = anchorRect.top < headerHeight + 4;
      const stillInProducts = gridRect ? gridRect.bottom > headerHeight + 40 : false;
      setFilterStuck(scrolledPastFilter && stillInProducts);
    };

    updateFloating();
    window.addEventListener("scroll", updateFloating, { passive: true });
    window.addEventListener("resize", updateFloating);
    return () => {
      window.removeEventListener("scroll", updateFloating);
      window.removeEventListener("resize", updateFloating);
    };
  }, []);

  const productNavIds = useMemo(() => products.map((product) => product.id), [products]);
  const isInitialLoad = loading && allProducts.length === 0;

  return (
    <section id="products" className="relative isolate overflow-x-clip bg-brandbg px-4 py-14">
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

        <div ref={filterAnchorRef}>
          <ProductFilters
            filterStuck={filterStuck}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            search={search}
            onSearchChange={setSearch}
            onClearSearch={() => setSearch("")}
            productsCount={products.length}
            totalProducts={totalProducts}
            shopCategories={shopCategories}
            giftPackCategory={giftPackCategory}
            isInitialLoad={isInitialLoad}
            onGiftBoxesClick={scrollToGiftBoxes}
          />
        </div>

        <div id="products-grid" className="scroll-mt-[calc(var(--header-height)+12rem)]">
          {isInitialLoad ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryLabel={getCategoryLabel(product.categoryKey)}
                  navProductIds={productNavIds}
                />
              ))}
            </div>
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
