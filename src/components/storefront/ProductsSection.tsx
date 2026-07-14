"use client";

import { useEffect, useMemo, useState } from "react";
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

function discountPct(mrp: number, price: number): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

function QtyControl({ product }: { product: ProductDTO }) {
  const changeQty = useCart((s) => s.changeQty);
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const mounted = useMounted();
  const shown = mounted ? qty : 0;
  const active = shown > 0;

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-full border shadow-sm transition ${
        active ? "border-primary/40 bg-white ring-2 ring-primary/15" : "border-line bg-white"
      }`}
    >
      <button
        type="button"
        aria-label="Remove"
        onClick={() => changeQty(product.id, -1)}
        className="flex h-10 w-10 items-center justify-center bg-brandbg text-xl font-bold text-primary transition hover:bg-primary/10 active:scale-95"
      >
        −
      </button>
      <span
        className={`w-10 text-center text-base font-bold tabular-nums ${
          active ? "text-primary" : "text-ink"
        }`}
      >
        {shown}
      </span>
      <button
        type="button"
        aria-label="Add"
        onClick={() => changeQty(product.id, 1)}
        className="flex h-10 w-10 items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-xl font-bold text-white transition hover:brightness-110 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

/** Mobile: hero image on top (full pack visible). Desktop: image · name · price · qty. */
function ProductListRow({ product }: { product: ProductDTO }) {
  const openProduct = useUI((s) => s.openProduct);
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const mounted = useMounted();
  const amount = mounted ? qty * product.price : 0;
  const inCart = mounted && qty > 0;
  const off = discountPct(product.mrp, product.price);

  return (
    <article
      className={`group border-b border-line/70 last:border-0 transition ${
        inCart ? "bg-primary/[0.04]" : "bg-white hover:bg-[#fffaf5]"
      }`}
    >
      {/* —— Mobile: big photo first, then details —— */}
      <div className="p-3 md:hidden">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff6ea] via-[#fffaf3] to-[#ffe8d2] p-3 shadow-[inset_0_0_0_1px_rgba(157,2,8,0.06)]"
        >
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            width={480}
            height={480}
            sizes="(max-width: 768px) 90vw, 200px"
            className="h-full w-full object-contain object-center drop-shadow-md"
          />
          {off != null && off >= 40 && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-yellow px-2.5 py-1 text-xs font-extrabold text-primary-dark shadow-sm">
              −{off}%
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
            Tap for details
          </span>
        </button>

        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => openProduct(product.id)}
              className="text-left font-display text-base font-semibold leading-snug text-ink"
            >
              {product.name}
            </button>
            <p className="mt-0.5 text-xs text-ink-muted">{product.pack}</p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
              <span className="text-xl font-extrabold text-green">{formatPrice(product.price)}</span>
              {inCart && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-bold text-primary">
                  Cart {formatPrice(amount)}
                </span>
              )}
            </div>
          </div>
          <QtyControl product={product} />
        </div>
      </div>

      {/* —— Desktop row —— */}
      <div className="hidden w-full grid-cols-[9.5rem_minmax(0,1.4fr)_9rem_10rem] items-center gap-x-5 px-5 py-3.5 md:grid">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="relative flex h-[11rem] w-[9.25rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#fff6ea] to-[#ffe8d2] p-1.5 shadow-[0_3px_12px_rgba(157,2,8,0.14)] ring-1 ring-black/5 transition group-hover:shadow-[0_6px_18px_rgba(157,2,8,0.2)] group-hover:ring-primary/25"
        >
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            width={200}
            height={240}
            className="h-full w-full object-contain object-center"
          />
          {off != null && off >= 40 && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-yellow px-1.5 py-0.5 text-[0.65rem] font-extrabold leading-none text-primary-dark shadow-sm">
              −{off}%
            </span>
          )}
        </button>

        <div className="min-w-0">
          <button
            type="button"
            onClick={() => openProduct(product.id)}
            className="text-left font-display text-[1.1rem] font-semibold leading-snug tracking-tight text-ink transition hover:text-primary"
          >
            {product.name}
          </button>
          <p className="mt-1 text-sm text-ink-muted">{product.pack}</p>
        </div>

        <div className="flex min-w-0 flex-col items-end justify-center border-l border-line/60 pl-4 text-right">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
            Price
          </span>
          <span className="mt-0.5 text-sm text-ink-muted/80 line-through">
            {formatPrice(product.mrp)}
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-green">
            {formatPrice(product.price)}
          </span>
          {off != null && (
            <span className="mt-1 rounded-full bg-yellow/90 px-2 py-0.5 text-[0.65rem] font-extrabold text-primary-dark">
              Save {off}%
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 border-l border-line/60 pl-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
            Qty
          </span>
          <QtyControl product={product} />
          {inCart && (
            <span className="text-xs font-bold text-primary">{formatPrice(amount)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductsSection() {
  const { categories, loading } = useCatalog();
  const cartItems = useCart((s) => s.items);
  const mounted = useMounted();
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  // Open all categories whenever the catalog loads / changes.
  useEffect(() => {
    if (categories.length === 0) return;
    setOpenCats((prev) => {
      const next = { ...prev };
      for (const category of categories) {
        if (next[category.key] === undefined) next[category.key] = true;
      }
      return next;
    });
  }, [categories]);

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
      <div className="mx-auto max-w-4xl">
        <SectionHead
          title="Crackers Price List — 80% Discount"
          subtitle="Browse by category · Large product photos · Tap + to add"
        />

        <div className="mb-6 flex justify-center">
          <PriceListButton
            label="Download Price List (PDF)"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(157,2,8,0.28)] transition hover:brightness-105 hover:shadow-[0_10px_24px_rgba(157,2,8,0.35)]"
          />
        </div>

        <div className="mx-auto mb-7 flex max-w-md items-center gap-2.5 rounded-2xl border border-line/80 bg-white/95 px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.06)] backdrop-blur">
          <span className="text-primary/70" aria-hidden>
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crackers..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-full px-2 py-0.5 text-xs font-semibold text-ink-muted hover:bg-brandbg hover:text-primary"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <OrderOffersBanner />

        <div className="mt-2 space-y-5">
          {loading && filtered.length === 0 && (
            <p className="rounded-2xl border border-line bg-white/90 py-10 text-center text-sm text-ink-muted shadow-sm">
              Loading products…
            </p>
          )}

          {filtered.map((category) => {
            const isOpen = hasSearch || openCats[category.key] !== false;
            const catQty = mounted
              ? category.products.reduce((sum, p) => sum + (cartItems[p.id] ?? 0), 0)
              : 0;
            return (
              <div key={category.key}>
                <button
                  type="button"
                  onClick={() => toggle(category.key)}
                  aria-expanded={isOpen}
                  className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[#b50610] to-primary-dark px-4 py-3.5 text-left text-white shadow-[0_8px_22px_rgba(157,2,8,0.32)] transition hover:brightness-[1.03] active:scale-[0.995]"
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                    }}
                    aria-hidden
                  />
                  <span className="relative font-display text-sm font-bold tracking-[0.04em] sm:text-base">
                    {category.label}
                  </span>
                  <span className="relative flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold text-white/95 backdrop-blur-sm">
                      {category.products.length} items
                      {catQty ? ` · ${catQty} in cart` : ""}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-line/70 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
                    {category.products.map((product) => (
                      <ProductListRow key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-white/80 py-12 text-center text-sm text-ink-muted">
              No products found. Try a different search or refresh the page.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
