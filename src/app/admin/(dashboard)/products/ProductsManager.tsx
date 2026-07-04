"use client";

import { useEffect, useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { discountPercent } from "@/lib/utils";

interface AdminProduct {
  id: string;
  name: string;
  pack: string;
  price: number;
  mrp: number;
  active: boolean;
  imageUrl: string;
  categoryKey: string;
  categoryLabel: string;
}

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/products");
        if (!response.ok) return;
        const data = await response.json();
        setProducts(data.products);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q),
    );
  }, [products, search]);

  const patch = async (id: string, body: Partial<AdminProduct>) => {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as AdminProduct;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } finally {
      setSavingId(null);
    }
  };

  const updateLocal = (id: string, field: "price" | "mrp", value: number) =>
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="text-sm text-ink-muted">{products.length} products · edit price &amp; visibility</p>
        </div>
        <input
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
      </div>

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">MRP</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Disc.</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-ink-muted">{product.pack}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted">{product.categoryLabel}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      className="input w-20 px-2 py-1"
                      value={product.mrp}
                      onChange={(e) => updateLocal(product.id, "mrp", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      className="input w-20 px-2 py-1"
                      value={product.price}
                      onChange={(e) => updateLocal(product.id, "price", Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-green">
                    {discountPercent(product.mrp, product.price)}%
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => patch(product.id, { active: !product.active })}
                      className={`relative h-6 w-11 rounded-full transition ${
                        product.active ? "bg-green" : "bg-line"
                      }`}
                      aria-pressed={product.active}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          product.active ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => patch(product.id, { price: product.price, mrp: product.mrp })}
                      disabled={savingId === product.id}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                    >
                      {savingId === product.id ? "..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                    Loading products...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
