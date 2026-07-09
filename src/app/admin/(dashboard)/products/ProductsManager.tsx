"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import { ProductPreviewModal } from "@/components/admin/ProductPreviewModal";
import { compressImage } from "@/lib/client-actions";
import { discountPercent } from "@/lib/utils";

interface Category {
  id: string;
  key: string;
  label: string;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  pack: string;
  price: number;
  mrp: number;
  active: boolean;
  imageUrl: string;
  description: string;
  sortOrder: number;
  categoryId: string;
  categoryKey: string;
  categoryLabel: string;
}

type Draft = Pick<
  AdminProduct,
  "name" | "pack" | "price" | "mrp" | "description" | "active" | "imageUrl" | "categoryId" | "sortOrder"
>;

type StatusFilter = "all" | "active" | "hidden";

const PAGE_SIZE = 25;

const EMPTY_ADD: Draft = {
  name: "",
  pack: "1 box",
  price: 0,
  mrp: 0,
  description: "",
  active: true,
  imageUrl: "/products/default.svg",
  categoryId: "",
  sortOrder: 0,
};

function toDraft(p: AdminProduct): Draft {
  return {
    name: p.name,
    pack: p.pack,
    price: p.price,
    mrp: p.mrp,
    description: p.description,
    active: p.active,
    imageUrl: p.imageUrl,
    categoryId: p.categoryId,
    sortOrder: p.sortOrder,
  };
}

function draftsEqual(a: Draft, b: Draft) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, hidden: 0 });
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<(Draft & { id: string; categoryLabel: string }) | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Draft>(EMPTY_ADD);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadCategories = useCallback(async () => {
    const catRes = await fetch("/api/admin/categories?take=500&skip=0");
    if (catRes.ok) {
      const data = await catRes.json();
      setCategories(data.categories as Category[]);
    }
  }, []);

  const load = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("take", String(PAGE_SIZE));
      params.set("skip", String((pageOverride ?? page) * PAGE_SIZE));

      const prodRes = await fetch(`/api/admin/products?${params.toString()}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const list = data.products as AdminProduct[];
        setProducts(list);
        setTotal(data.total);
        setStats(data.stats ?? { total: data.total, active: 0, hidden: 0 });
        setDrafts(Object.fromEntries(list.map((p) => [p.id, toDraft(p)])));
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(0);
    setSelected(new Set());
  }, [search, statusFilter, categoryFilter]);

  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const isDirty = (id: string) => {
    const product = products.find((p) => p.id === id);
    const draft = drafts[id];
    if (!product || !draft) return false;
    return !draftsEqual(draft, toDraft(product));
  };

  const discard = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) setDrafts((prev) => ({ ...prev, [id]: toDraft(product) }));
  };

  const save = async (id: string, draftOverride?: Draft) => {
    const draft = draftOverride ?? drafts[id];
    if (!draft) return false;
    setSavingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Failed to save product.",
        });
        return false;
      }
      const updated = data as AdminProduct;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setDrafts((prev) => ({ ...prev, [id]: toDraft(updated) }));
      setMessage({ type: "ok", text: `"${updated.name}" saved.` });
      return true;
    } catch {
      setMessage({ type: "err", text: "Network error while saving." });
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const uploadImageFile = async (
    key: string,
    file: File,
    filename: string,
    onUploaded: (imageUrl: string) => Promise<void> | void,
  ) => {
    setUploadingId(key);
    setMessage(null);
    try {
      const dataUrl = await compressImage(file, 720, 0.62);
      const uploadRes = await fetch("/api/admin/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, filename }),
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(
          typeof uploadData.error === "string" ? uploadData.error : "Upload failed",
        );
      }
      const { imageUrl } = uploadData as { imageUrl: string };
      await onUploaded(imageUrl);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Image upload failed.";
      setMessage({ type: "err", text });
    } finally {
      setUploadingId(null);
    }
  };

  const uploadProductImage = (id: string, file: File) =>
    uploadImageFile(id, file, id, async (imageUrl) => {
      const product = products.find((p) => p.id === id);
      const base = drafts[id] ?? (product ? toDraft(product) : null);
      if (!base) return;
      const nextDraft = { ...base, imageUrl };
      updateDraft(id, { imageUrl });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl } : p)));
      const ok = await save(id, nextDraft);
      if (ok) setMessage({ type: "ok", text: "Product image saved." });
    });

  const uploadAddImage = (file: File) =>
    uploadImageFile("new", file, `new-${Date.now()}`, (imageUrl) => {
      setAddForm((f) => ({ ...f, imageUrl }));
      setMessage({ type: "ok", text: "Image ready — click Add Product to save." });
    });

  const deleteProduct = async (id: string) => {
    const draft = drafts[id];
    if (!confirm(`Delete "${draft?.name ?? "this product"}" permanently?`)) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage({ type: "err", text: "Could not delete product." });
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMessage({ type: "ok", text: "Product deleted." });
    void load();
  };

  const duplicateProduct = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setSavingId(id);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${product.name} (Copy)`,
          pack: product.pack,
          price: product.price,
          mrp: product.mrp,
          description: product.description,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          active: false,
        }),
      });
      if (!response.ok) throw new Error();
      const created = (await response.json()) as AdminProduct;
      setExpandedId(created.id);
      setMessage({ type: "ok", text: `Duplicated as "${created.name}" (hidden until you enable).` });
      void load();
    } catch {
      setMessage({ type: "err", text: "Duplicate failed." });
    } finally {
      setSavingId(null);
    }
  };

  const bulkAction = async (action: "enable" | "disable" | "delete") => {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} product(s)?`)) return;

    const response = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    if (!response.ok) {
      setMessage({ type: "err", text: "Bulk action failed." });
      return;
    }
    if (action === "delete") {
      setDrafts((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
    }
    setSelected(new Set());
    setMessage({ type: "ok", text: `Bulk ${action} applied to ${ids.length} item(s).` });
    void load();
  };

  const createProduct = async () => {
    if (!addForm.name.trim() || !addForm.categoryId) {
      setMessage({ type: "err", text: "Name and category are required." });
      return;
    }
    setSavingId("new");
    try {
      const mrp = addForm.mrp || addForm.price * 5;
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, mrp }),
      });
      if (!response.ok) throw new Error();
      const created = (await response.json()) as AdminProduct;
      setShowAdd(false);
      setAddForm({ ...EMPTY_ADD, categoryId: categories[0]?.id ?? "" });
      setExpandedId(created.id);
      setMessage({ type: "ok", text: `"${created.name}" added.` });
      setPage(0);
      void load(0);
    } catch {
      setMessage({ type: "err", text: "Could not add product." });
    } finally {
      setSavingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const openPreview = (id: string) => {
    const draft = drafts[id];
    const product = products.find((p) => p.id === id);
    if (!draft || !product) return;
    const cat = categories.find((c) => c.id === draft.categoryId);
    setPreviewDraft({
      ...draft,
      id,
      categoryLabel: cat?.label ?? product.categoryLabel,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="text-sm text-ink-muted">
            {stats.total} total · {stats.active} active · {stats.hidden} hidden
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAddForm((f) => ({ ...f, categoryId: f.categoryId || categories[0]?.id || "" }));
              setShowAdd(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
          >
            + Add Product
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
          >
            View Storefront ↗
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
        <select
          className="input max-w-[200px] py-2"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {(["all", "active", "hidden"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
              statusFilter === f
                ? "bg-primary text-white"
                : "border border-line bg-white text-ink-muted hover:border-primary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm font-semibold text-ink">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => bulkAction("enable")}
            className="rounded-md bg-green px-3 py-1 text-xs font-bold text-white"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={() => bulkAction("disable")}
            className="rounded-md bg-ink-muted px-3 py-1 text-xs font-bold text-white"
          >
            Disable
          </button>
          <button
            type="button"
            onClick={() => bulkAction("delete")}
            className="rounded-md bg-red px-3 py-1 text-xs font-bold text-white"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-semibold text-ink-muted hover:text-primary"
          >
            Clear
          </button>
        </div>
      )}

      {message && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            message.type === "ok" ? "bg-green/10 text-green" : "bg-red/10 text-red"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Select all */}
      {!loading && products.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={selected.size === products.length && products.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-line"
          />
          Select all on this page ({products.length})
        </label>
      )}

      {/* Product list */}
      <div className="space-y-3">
        {products.map((product) => {
          const draft = drafts[product.id] ?? toDraft(product);
          const dirty = isDirty(product.id);
          const expanded = expandedId === product.id;
          const categoryLabel =
            categories.find((c) => c.id === draft.categoryId)?.label ?? product.categoryLabel;

          return (
            <div
              key={product.id}
              className={`rounded-xl border bg-white shadow-sm transition ${
                dirty ? "border-primary/40 ring-1 ring-primary/20" : "border-line"
              } ${!draft.active ? "opacity-75" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="h-4 w-4 shrink-0 rounded border-line"
                />

                <ProductImageUpload
                  size="sm"
                  imageUrl={draft.imageUrl}
                  alt={product.name}
                  uploading={uploadingId === product.id}
                  onFile={(file) => void uploadProductImage(product.id, file)}
                />

                <div className="min-w-0 flex-1">
                  <input
                    className="input w-full max-w-md py-1.5 font-medium"
                    value={draft.name}
                    onChange={(e) => updateDraft(product.id, { name: e.target.value })}
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{categoryLabel}</span>
                    {!draft.active && (
                      <span className="rounded bg-red/10 px-1.5 py-0.5 font-semibold text-red">Hidden</span>
                    )}
                  </div>
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
                    title={draft.active ? "Active" : "Disabled"}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        draft.active ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => openPreview(product.id)}
                    className="mb-0.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : product.id)}
                    className="mb-0.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary"
                  >
                    {expanded ? "Less" : "More"}
                  </button>
                  {dirty && (
                    <button
                      type="button"
                      onClick={() => discard(product.id)}
                      className="mb-0.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-muted"
                    >
                      Undo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => save(product.id)}
                    disabled={!dirty || savingId === product.id}
                    className="mb-0.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {savingId === product.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="space-y-3 border-t border-line bg-brandbg/50 px-4 py-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs">
                      <span className="mb-1 block font-semibold text-ink-muted">Category</span>
                      <select
                        className="input py-1.5"
                        value={draft.categoryId}
                        onChange={(e) => updateDraft(product.id, { categoryId: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs">
                      <span className="mb-1 block font-semibold text-ink-muted">Sort order</span>
                      <input
                        type="number"
                        className="input py-1.5"
                        value={draft.sortOrder}
                        onChange={(e) => updateDraft(product.id, { sortOrder: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold text-ink-muted">Pack / unit</span>
                    <input
                      className="input py-1.5"
                      value={draft.pack}
                      onChange={(e) => updateDraft(product.id, { pack: e.target.value })}
                    />
                  </label>
                  <ProductImageUpload
                    size="lg"
                    imageUrl={draft.imageUrl}
                    alt={draft.name || product.name}
                    uploading={uploadingId === product.id}
                    onFile={(file) => void uploadProductImage(product.id, file)}
                    showUrlField
                    onUrlChange={(url) => updateDraft(product.id, { imageUrl: url })}
                  />
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold text-ink-muted">Description</span>
                    <textarea
                      className="input min-h-[80px] resize-y py-2"
                      value={draft.description}
                      onChange={(e) => updateDraft(product.id, { description: e.target.value })}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => duplicateProduct(product.id)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/10"
                    >
                      Delete
                    </button>
                  </div>
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
        {!loading && products.length === 0 && (
          <div className="rounded-xl border border-line bg-white px-4 py-12 text-center text-ink-muted">
            No products found.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="border-t-0"
        />
      </div>

      {/* Add product modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-ink">Add New Product</h2>
            <div className="mt-4 space-y-3">
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Product name *</span>
                <input
                  className="input py-1.5"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 7 cm Electric Sparklers"
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Category *</span>
                <select
                  className="input py-1.5"
                  value={addForm.categoryId}
                  onChange={(e) => setAddForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="mb-1 block font-semibold text-ink-muted">Price (₹)</span>
                  <input
                    type="number"
                    className="input py-1.5"
                    value={addForm.price || ""}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setAddForm((f) => ({
                        ...f,
                        price,
                        mrp: f.mrp || price * 5,
                      }));
                    }}
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-semibold text-ink-muted">MRP (₹)</span>
                  <input
                    type="number"
                    className="input py-1.5"
                    value={addForm.mrp || ""}
                    onChange={(e) => setAddForm((f) => ({ ...f, mrp: Number(e.target.value) }))}
                  />
                </label>
              </div>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Pack / unit</span>
                <input
                  className="input py-1.5"
                  value={addForm.pack}
                  onChange={(e) => setAddForm((f) => ({ ...f, pack: e.target.value }))}
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Description</span>
                <textarea
                  className="input min-h-[72px] py-2"
                  value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <ProductImageUpload
                size="lg"
                imageUrl={addForm.imageUrl}
                alt={addForm.name || "New product"}
                uploading={uploadingId === "new"}
                onFile={(file) => void uploadAddImage(file)}
                showUrlField
                onUrlChange={(url) => setAddForm((f) => ({ ...f, imageUrl: url }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createProduct()}
                disabled={savingId === "new"}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingId === "new" ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDraft && (
        <ProductPreviewModal product={previewDraft} onClose={() => setPreviewDraft(null)} />
      )}
    </div>
  );
}
