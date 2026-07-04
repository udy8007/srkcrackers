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
  description: string;
  categoryKey: string;
  categoryLabel: string;
}

type Draft = Pick<AdminProduct, "name" | "pack" | "price" | "mrp" | "description" | "active">;

function toDraft(p: AdminProduct): Draft {
  return {
    name: p.name,
    pack: p.pack,
    price: p.price,
    mrp: p.mrp,
    description: p.description,
    active: p.active,
  };
}

function draftsEqual(a: Draft, b: Draft) {
  return (
    a.name === b.name &&
    a.pack === b.pack &&
    a.price === b.price &&
    a.mrp === b.mrp &&
    a.description === b.description &&
    a.active === b.active
  );
}

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/products");
        if (!response.ok) return;
        const data = await response.json();
        const list = data.products as AdminProduct[];
        setProducts(list);
        setDrafts(Object.fromEntries(list.map((p) => [p.id, toDraft(p)])));
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

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const isDirty = (id: string) => {
    const product = products.find((p) => p.id === id);
    const draft = drafts[id];
    if (!product || !draft) return false;
    return !draftsEqual(draft, toDraft(product));
  };

  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        setMessage({ type: "err", text: "Failed to save product. Check values and try again." });
        return;
      }
      const updated = (await response.json()) as AdminProduct;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setDrafts((prev) => ({ ...prev, [id]: toDraft(updated) }));
      setMessage({ type: "ok", text: `"${updated.name}" saved successfully.` });
    } catch {
      setMessage({ type: "err", text: "Network error while saving." });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="text-sm text-ink-muted">
            {products.length} products · edit details and click Save to update the storefront
          </p>
        </div>
        <input
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            message.type === "ok" ? "bg-green/10 text-green" : "bg-red/10 text-red"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((product) => {
          const draft = drafts[product.id] ?? toDraft(product);
          const dirty = isDirty(product.id);
          const expanded = expandedId === product.id;

          return (
            <div
              key={product.id}
              className={`rounded-xl border bg-white shadow-sm transition ${
                dirty ? "border-primary/40 ring-1 ring-primary/20" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <SafeImage
                  src={product.imageUrl}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <input
                    className="input w-full max-w-md py-1.5 font-medium"
                    value={draft.name}
                    onChange={(e) => updateDraft(product.id, { name: e.target.value })}
                  />
                  <div className="mt-1 text-xs text-ink-muted">{product.categoryLabel}</div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs">
                    <span className="mb-0.5 block font-semibold text-ink-muted">MRP</span>
                    <input
                      type="number"
                      className="input w-20 px-2 py-1"
                      value={draft.mrp}
                      onChange={(e) => updateDraft(product.id, { mrp: Number(e.target.value) })}
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-0.5 block font-semibold text-ink-muted">Price</span>
                    <input
                      type="number"
                      className="input w-20 px-2 py-1"
                      value={draft.price}
                      onChange={(e) => updateDraft(product.id, { price: Number(e.target.value) })}
                    />
                  </label>
                  <span className="pb-1 text-xs font-semibold text-green">
                    {discountPercent(draft.mrp, draft.price)}% off
                  </span>
                  <button
                    type="button"
                    onClick={() => updateDraft(product.id, { active: !draft.active })}
                    className={`relative mb-0.5 h-6 w-11 rounded-full transition ${
                      draft.active ? "bg-green" : "bg-line"
                    }`}
                    aria-pressed={draft.active}
                    title={draft.active ? "Active on storefront" : "Hidden from storefront"}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        draft.active ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : product.id)}
                    className="mb-0.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary"
                  >
                    {expanded ? "Less" : "More"}
                  </button>
                  <button
                    type="button"
                    onClick={() => save(product.id)}
                    disabled={!dirty || savingId === product.id}
                    className="mb-0.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingId === product.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="space-y-3 border-t border-line bg-brandbg/50 px-4 py-3">
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold text-ink-muted">Pack / unit</span>
                    <input
                      className="input py-1.5"
                      value={draft.pack}
                      onChange={(e) => updateDraft(product.id, { pack: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold text-ink-muted">Description</span>
                    <textarea
                      className="input min-h-[72px] resize-y py-2"
                      value={draft.description}
                      onChange={(e) => updateDraft(product.id, { description: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="rounded-xl border border-line bg-white px-4 py-12 text-center text-ink-muted">
            Loading products...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-line bg-white px-4 py-12 text-center text-ink-muted">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}
