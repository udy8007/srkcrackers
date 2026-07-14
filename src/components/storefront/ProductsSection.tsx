"use client";

import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { SectionHead } from "./SectionHead";
import { SectionDecor } from "./FestiveDecor";
import { PriceListButton } from "./PriceListButton";
import { OrderOffersBanner } from "./OrderOffersBanner";
import { useCatalog } from "./catalog-context";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useMounted } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";
import type { ProductDTO } from "@/types";

function QtyControl({ product }: { product: ProductDTO }) {
  const changeQty = useCart((s) => s.changeQty);
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const mounted = useMounted();
  const shown = mounted ? qty : 0;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-line shadow-sm">
      <button
        type="button"
        aria-label="Remove"
        onClick={() => changeQty(product.id, -1)}
        className="flex h-9 w-9 items-center justify-center bg-brandbg text-xl font-bold text-primary transition hover:bg-line"
      >
        −
      </button>
      <span className="w-10 text-center text-base font-semibold">{shown}</span>
      <button
        type="button"
        aria-label="Add"
        onClick={() => changeQty(product.id, 1)}
        className="flex h-9 w-9 items-center justify-center bg-primary text-xl font-bold text-white transition hover:bg-primary-dark"
      >
        +
      </button>
    </div>
  );
}

/** One product per row — no card grid / collage. */
function ProductListRow({ product }: { product: ProductDTO }) {
  const openProduct = useUI((s) => s.openProduct);
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const mounted = useMounted();
  const amount = mounted ? qty * product.price : 0;

  return (
    <article className="flex items-center gap-3 border-b border-line/80 bg-white px-3 py-3 last:border-0 sm:px-4">
      <button type="button" onClick={() => openProduct(product.id)} className="shrink-0">
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          width={64}
          height={64}
          className="h-14 w-14 rounded-md object-cover sm:h-16 sm:w-16"
        />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="text-left text-sm font-semibold leading-snug text-ink hover:text-primary sm:text-[0.95rem]"
        >
          {product.name}
        </button>
        <p className="mt-0.5 text-xs text-ink-muted">{product.pack}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
          <span className="text-base font-bold text-green">{formatPrice(product.price)}</span>
          {mounted && qty > 0 && (
            <span className="text-xs font-semibold text-primary">· {formatPrice(amount)}</span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <QtyControl product={product} />
      </div>
    </article>
  );
}

export function ProductsSection() {
  const { categories } = useCatalog();
  const cartItems = useCart((s) => s.items);
  const mounted = useMounted();
  const [search, setSearch] = useState("");
  /** Categories start open so the full single-column product list is visible. */
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.key, true])),
  );

  const query = search.trim().toLowerCase();
  const hasSearch = query.length > 0;

  const filtered = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        products: hasSearch
          ? category.products.filter(
              (p) =>
                p.name.toLowerCase().includes(query) ||
                p.pack.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query),
            )
          : category.products,
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, query, hasSearch]);

  const toggle = (key: string) => setOpenCats((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <section id="products" className="relative isolate overflow-hidden bg-brandbg px-4 py-14">
      <SectionDecor variant="rockets" />
      <div className="mx-auto max-w-3xl">
        <SectionHead
          title="Crackers Price List — 80% Discount"
          subtitle="Browse by category · One product per row · Tap + to add"
        />

        <div className="mb-6 flex justify-center">
          <PriceListButton
            label="Download Price List (PDF)"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105"
          />
        </div>

        <div className="mx-auto mb-6 flex max-w-md items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 shadow-sm">
          <span className="text-ink-muted">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crackers..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
        </div>

        <OrderOffersBanner />

        <div className="space-y-4">
          {filtered.map((category) => {
            const isOpen = hasSearch || openCats[category.key] !== false;
            const catQty = mounted
              ? category.products.reduce((sum, p) => sum + (cartItems[p.id] ?? 0), 0)
              : 0;
            return (
              <div key={category.key} className="space-y-2">
                {/* Category header — distinct red bar, separate from the product list */}
                <button
                  type="button"
                  onClick={() => toggle(category.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-3.5 text-left text-white shadow-md"
                >
                  <span className="font-display text-sm font-semibold tracking-wide sm:text-base">
                    {category.label}
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="whitespace-nowrap text-white/90">
                      {category.products.length} items
                      {catQty ? ` · ${catQty} in cart` : ""}
                    </span>
                    <span
                      className={`inline-block transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                    {category.products.map((product) => (
                      <ProductListRow key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-line bg-white py-10 text-center text-sm text-ink-muted">
              No products found. Try a different search.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
