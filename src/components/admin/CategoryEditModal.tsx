"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface CategoryEditData {
  id: string;
  key: string;
  label: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
}

interface CategoryEditModalProps {
  category: CategoryEditData;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: { label: string; active: boolean; sortOrder: number }) => void;
}

export function CategoryEditModal({ category, saving, onClose, onSave }: CategoryEditModalProps) {
  const [label, setLabel] = useState(category.label);
  const [sortOrder, setSortOrder] = useState(category.sortOrder);
  const [active, setActive] = useState(category.active);

  useEffect(() => {
    setLabel(category.label);
    setSortOrder(category.sortOrder);
    setActive(category.active);
  }, [category]);

  const dirty =
    label.trim() !== category.label ||
    sortOrder !== category.sortOrder ||
    active !== category.active;

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSave({ label: trimmed, active, sortOrder });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-bold text-ink">Edit Category</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-brandbg disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Key</span>
            <p className="mt-1 font-mono text-sm text-ink">{category.key}</p>
          </div>

          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Display Label</span>
            <input
              className="input py-2 text-sm"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={saving}
            />
          </label>

          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Sort Order</span>
            <input
              type="number"
              className="input w-28 py-2 text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              disabled={saving}
            />
          </label>

          <div className="flex items-center justify-between rounded-lg border border-line bg-brandbg/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Storefront visibility</p>
              <p className="text-xs text-ink-muted">
                {active ? "Visible to customers" : "Hidden from storefront"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              disabled={saving}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                active ? "bg-green/10 text-green" : "bg-ink/10 text-ink-muted",
              )}
            >
              {active ? "Visible" : "Hidden"}
            </button>
          </div>

          <p className="text-xs text-ink-muted">
            {category.productCount} product{category.productCount === 1 ? "" : "s"} in this category
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-brandbg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || !label.trim() || saving}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
