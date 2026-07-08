"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";

interface CategoryAddModalProps {
  defaultSortOrder: number;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { key: string; label: string; active: boolean; sortOrder: number }) => void;
}

export function CategoryAddModal({ defaultSortOrder, saving, onClose, onSave }: CategoryAddModalProps) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [active, setActive] = useState(true);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    if (!keyTouched) setKey(slugify(value));
  };

  const handleSave = () => {
    const trimmedLabel = label.trim();
    const trimmedKey = (keyTouched ? key : slugify(label)).trim();
    if (!trimmedLabel || !trimmedKey) return;
    onSave({ key: trimmedKey, label: trimmedLabel, active, sortOrder });
  };

  const canSave = label.trim().length > 0 && (keyTouched ? key.trim() : slugify(label)).length > 0;

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
          <h2 className="font-display text-lg font-bold text-ink">Add Category</h2>
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
          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Display Label</span>
            <input
              className="input py-2 text-sm"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="e.g. SPARKLERS (80% OFF)"
              disabled={saving}
              autoFocus
            />
          </label>

          <label className="block text-xs">
            <span className="mb-1 block font-semibold text-ink-muted">Key</span>
            <input
              className="input py-2 font-mono text-sm"
              value={keyTouched ? key : slugify(label)}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              placeholder="e.g. sparklers"
              disabled={saving}
            />
            <span className="mt-1 block text-ink-muted">Internal identifier used in URLs and product links</span>
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
            disabled={!canSave || saving}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
          >
            {saving ? "Adding..." : "Add category"}
          </button>
        </div>
      </div>
    </div>
  );
}
