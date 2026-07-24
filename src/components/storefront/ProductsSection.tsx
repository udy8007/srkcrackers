"use client";

import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import type { ProductDTO } from "@/types";
import { OrderOffersBanner } from "./OrderOffersBanner";
import { PriceListButton } from "./PriceListButton";
import { SectionDecor } from "./FestiveDecor";
import { SectionHead } from "./SectionHead";
import { useCatalog } from "./catalog-context";

function discountPct(mrp: number, price: number): number | null {
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;
}

function ProductCard({ product }: { product: ProductDTO }) {
  const openProduct = useUI((state) => state.openProduct);
  const changeQty = useCart((state) => state.changeQty);
  const qty = useCart((state) => state.items[product.id] ?? 0);
  const mounted = useMounted();
  const shownQty = mounted ? qty : 0;
  const discount = discountPct(product.mrp, product.price);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_7px_24px_rgba(90,0,8,0.08)] transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(90,0,8,0.14)] ${
        shownQty > 0 ? "border-primary/40 ring-2 ring-primary/15" : "border-[#ead9c8]"
      }`}
    >
      <button
        type="button"
        onClick={() => openProduct(product.id)}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#fff9f1] to-[#ffead7] p-4"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 25vw"
          className="h-full w-full object-contain drop-shadow-md transition duration-300 group-hover:scale-[1.03]"
        />
        {discount && (
          <span className="absolute left-3 top-3 rounded-md bg-yellow px-2.5 py-1 text-xs font-extrabold text-primary-dark shadow-sm">
            {discount}% Off
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="flex flex-1 flex-col text-left transition hover:opacity-90"
        >
          <span className="font-display text-base font-bold leading-snug text-ink group-hover:text-primary">
            {product.name}
          </span>
          {product.nameTa && (
            <span className="mt-1 line-clamp-1 text-sm text-ink/70" lang="ta">
              {product.nameTa}
            </span>
          )}
          <span className="mt-1 text-xs text-ink-muted">{product.pack}</span>

          <span className="mt-auto flex items-baseline gap-2 pt-4">
            <span className="text-xl font-extrabold text-primary">{formatPrice(product.price)}</span>
            <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
          </span>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-ink-muted">
            {shownQty > 0 ? `${shownQty} in cart` : "Quantity"}
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-full border border-line bg-white shadow-sm">
            <button
              type="button"
              aria-label={`Remove ${product.name}`}
              onClick={() => changeQty(product.id, -1)}
              className="flex h-9 w-9 items-center justify-center bg-brandbg text-lg font-bold text-primary hover:bg-primary/10"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums text-ink">{shownQty}</span>
            <button
              type="button"
              aria-label={`Add ${product.name}`}
              onClick={() => changeQty(product.id, 1)}
              className="flex h-9 w-9 items-center justify-center bg-primary text-lg font-bold text-white hover:brightness-110"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function scrollToGiftBoxes() {
  document.getElementById("gift-packs")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ProductsSection() {
  const { categories, loading } = useCatalog();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const giftPackCategory = useMemo(
    () => categories.find((category) => category.key === "gift-packs"),
    [categories],
  );
  const shopCategories = useMemo(
    () => categories.filter((category) => category.key !== "gift-packs"),
    [categories],
  );
  const totalProducts = useMemo(
    () => shopCategories.reduce((total, category) => total + category.products.length, 0),
    [shopCategories],
  );
  const query = search.trim().toLowerCase();

  const products = useMemo(() => {
    return shopCategories
      .filter((category) => selectedCategory === "all" || category.key === selectedCategory)
      .flatMap((category) => category.products)
      .filter(
        (product) =>
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.nameTa?.toLowerCase().includes(query) ?? false) ||
          product.pack.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query),
      );
  }, [shopCategories, selectedCategory, query]);

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
              {products.length} {products.length === 1 ? "product" : "products"} shown
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
                    {category.label} ({category.products.length})
                  </option>
                ))}
                {giftPackCategory && (
                  <option value="gift-packs">
                    Gift Boxes ({giftPackCategory.products.length}) — go to section
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
                  {category.products.length}
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
                  {giftPackCategory.products.length}
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

        {loading && products.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">Loading products…</p>
        ) : products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-white/80 py-12 text-center text-sm text-ink-muted">
            No products found. Try another category or search.
          </p>
        )}
      </div>
    </section>
  );
}
