import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  pruneInvalid: (validIds: Iterable<string>) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const current = get().ids;
        const exists = current.includes(id);
        if (exists) {
          set({ ids: current.filter((item) => item !== id) });
          return false;
        }
        set({ ids: [...current, id] });
        return true;
      },
      has: (id) => get().ids.includes(id),
      remove: (id) => set({ ids: get().ids.filter((item) => item !== id) }),
      clear: () => set({ ids: [] }),
      pruneInvalid: (validIds) =>
        set((state) => {
          const valid = new Set(validIds);
          const ids = state.ids.filter((id) => valid.has(id));
          return ids.length === state.ids.length ? state : { ids };
        }),
    }),
    { name: "srk-wishlist" },
  ),
);

export function selectWishlistCount(ids: string[]): number {
  return ids.length;
}
