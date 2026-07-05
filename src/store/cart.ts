import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  /** productId -> quantity */
  items: Record<string, number>;
  setQty: (id: string, qty: number) => void;
  changeQty: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Drop cart lines whose product id is not in the current catalog. */
  pruneInvalid: (validIds: Iterable<string>) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      setQty: (id, qty) =>
        set((state) => {
          const items = { ...state.items };
          const next = Math.max(0, Math.floor(qty));
          if (next <= 0) delete items[id];
          else items[id] = next;
          return { items };
        }),
      changeQty: (id, delta) => {
        const current = get().items[id] ?? 0;
        get().setQty(id, current + delta);
      },
      remove: (id) =>
        set((state) => {
          const items = { ...state.items };
          delete items[id];
          return { items };
        }),
      clear: () => set({ items: {} }),
      pruneInvalid: (validIds) =>
        set((state) => {
          const valid = new Set(validIds);
          const items = { ...state.items };
          let changed = false;
          for (const id of Object.keys(items)) {
            if (!valid.has(id)) {
              delete items[id];
              changed = true;
            }
          }
          return changed ? { items } : state;
        }),
    }),
    { name: "srk-cart" },
  ),
);

/** Total quantity across all items. */
export function selectCartCount(items: Record<string, number>): number {
  return Object.values(items).reduce((sum, qty) => sum + qty, 0);
}
