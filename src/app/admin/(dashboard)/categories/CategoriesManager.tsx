"use client";

import { useCallback, useEffect, useState } from "react";
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

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories);
    } finally {
      setLoading(false);
    }
  }, []);

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
        setMessage("Save failed");
        return;
      }
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setMessage("Category updated");
      if (closeModal) setEditingCategory(null);
    } catch {
      setMessage("Network error");
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = (cat: CategoryRow) => save(cat.id, { active: !cat.active });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Categories</h1>
        <p className="text-sm text-ink-muted">
          Rename, reorder, or hide categories on the storefront
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-green/10 px-4 py-2 text-sm font-medium text-green">{message}</p>
      )}

      <div className="rounded-xl border border-line bg-white shadow-sm">
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
    </div>
  );
}
