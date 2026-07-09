"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { CategoryAddModal } from "@/components/admin/CategoryAddModal";
import { CategoryEditModal } from "@/components/admin/CategoryEditModal";
import { cn } from "@/lib/utils";

interface CategoryRow {
  id: string;
  key: string;
  label: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
}

const PAGE_SIZE = 25;

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [nextSortOrder, setNextSortOrder] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        take: String(PAGE_SIZE),
        skip: String((pageOverride ?? page) * PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/categories?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories);
      setTotal(data.total);
      setNextSortOrder(data.nextSortOrder ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (
    id: string,
    patch: Partial<{ label: string; active: boolean; sortOrder: number }>,
    closeModal = false,
  ) => {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setMessage({ type: "err", text: "Save failed" });
        return;
      }
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setMessage({ type: "ok", text: "Category updated" });
      if (closeModal) setEditingCategory(null);
      void load();
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setSavingId(null);
    }
  };

  const createCategory = async (data: { key: string; label: string; active: boolean; sortOrder: number }) => {
    setSavingId("new");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "err",
          text: typeof payload.error === "string" ? payload.error : "Could not add category",
        });
        return;
      }
      setShowAdd(false);
      setMessage({ type: "ok", text: `"${data.label}" added.` });
      const nextPage = Math.max(0, Math.ceil((total + 1) / PAGE_SIZE) - 1);
      setPage(nextPage);
      void load(nextPage);
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = (cat: CategoryRow) => save(cat.id, { active: !cat.active });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
          <p className="text-sm text-ink-muted">
            Add, rename, reorder, or hide categories on the storefront
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
        >
          + Add Category
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            message.type === "ok" ? "bg-green/10 text-green" : "bg-red/10 text-red"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink-muted">
            {total} categor{total === 1 ? "y" : "ies"}
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark"
          >
            + Add Category
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Display Label</th>
                <th className="px-4 py-3 font-semibold">Sort</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{cat.key}</td>
                  <td className="px-4 py-3 font-medium text-ink">{cat.label}</td>
                  <td className="px-4 py-3 text-ink-muted">{cat.sortOrder}</td>
                  <td className="px-4 py-3 font-semibold">{cat.productCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(cat)}
                      disabled={savingId === cat.id}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        cat.active
                          ? "bg-green/10 text-green"
                          : "bg-ink/10 text-ink-muted",
                      )}
                    >
                      {cat.active ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                    No categories found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          saving={savingId === editingCategory.id}
          onClose={() => {
            if (savingId !== editingCategory.id) setEditingCategory(null);
          }}
          onSave={(patch) => save(editingCategory.id, patch, true)}
        />
      )}

      {showAdd && (
        <CategoryAddModal
          defaultSortOrder={nextSortOrder}
          saving={savingId === "new"}
          onClose={() => {
            if (savingId !== "new") setShowAdd(false);
          }}
          onSave={createCategory}
        />
      )}
    </div>
  );
}
