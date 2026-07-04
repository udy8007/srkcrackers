"use client";

import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { SectionHead } from "./SectionHead";
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
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
      <button
        type="button"
        aria-label="Remove"
        onClick={() => changeQty(product.id, -1)}
        className="flex h-8 w-8 items-center justify-center bg-brandbg text-lg font-bold text-primary transition hover:bg-line"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-semibold">{shown}</span>
      <button
        type="button"
        aria-label="Add"
        onClick={() => changeQty(product.id, 1)}
        className="flex h-8 w-8 items-center justify-center bg-primary text-lg font-bold text-white transition hover:bg-primary-dark"
      >
        +
      </button>
    </div>
  );
}

function ProductRow({ product }: { product: ProductDTO }) {
  const openProduct = useUI((s) => s.openProduct);
  const qty = useCart((s) => s.items[product.id] ?? 0);
  const mounted = useMounted();
  const amount = mounted ? qty * product.price : 0;

  return (
    <tr className="border-b border-line last:border-0">
      <td className="p-2">
        <button type="button" onClick={() => openProduct(product.id)} className="block">
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-md object-cover"
          />
        </button>
      </td>
      <td className="p-2">
        <button
          type="button"
          onClick={() => openProduct(product.id)}
          className="text-left text-sm font-semibold text-ink hover:text-primary"
        >
          {product.name}
        </button>
        <span className="block text-xs text-ink-muted">{product.pack}</span>
        <span className="mt-0.5 block text-[0.7rem] text-primary/70">👆 Tap for details</span>
      </td>
      <td className="p-2 text-center">
        <span className="block text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>
        <span className="block text-sm font-bold text-green">{formatPrice(product.price)}</span>
      </td>
      <td className="p-2 text-center">
        <QtyControl product={product} />
      </td>
      <td className="p-2 text-right text-sm font-bold text-primary">{formatPrice(amount)}</td>
    </tr>
  );
}

export function ProductsSection() {
  const { categories } = useCatalog();
  const cartItems = useCart((s) => s.items);
  const mounted = useMounted();
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => ({
    [categories[0]?.key ?? ""]: true,
  }));

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
    <section id="products" className="bg-brandbg px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <SectionHead
          title="Crackers Price List — 80% Discount"
          subtitle="Select a category to expand · Tap product name or image for full description"
        />

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

        <div className="space-y-3">
          {filtered.map((category) => {
            const isOpen = hasSearch || openCats[category.key];
            const catQty = mounted
              ? category.products.reduce((sum, p) => sum + (cartItems[p.id] ?? 0), 0)
              : 0;
            return (
              <div
                key={category.key}
                className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(category.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 bg-gradient-to-r from-primary to-primary-dark px-4 py-3.5 text-left text-white"
                >
                  <span className="font-display text-sm font-semibold sm:text-base">
                    {category.label}
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="whitespace-nowrap text-white/85">
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead>
                        <tr className="bg-brandbg text-left text-[0.7rem] uppercase tracking-wide text-ink-muted">
                          <th className="p-2 font-semibold">Image</th>
                          <th className="p-2 font-semibold">Products</th>
                          <th className="p-2 text-center font-semibold">Price</th>
                          <th className="p-2 text-center font-semibold">Qty</th>
                          <th className="p-2 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.products.map((product) => (
                          <ProductRow key={product.id} product={product} />
                        ))}
                      </tbody>
                    </table>
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
