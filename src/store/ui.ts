import { create } from "zustand";

export interface TrackPrefill {
  orderNumber: string;
  phone: string;
}

interface UIState {
  productModalId: string | null;
  checkoutOpen: boolean;
  cartOpen: boolean;
  mobileNavOpen: boolean;
  trackPrefill: TrackPrefill | null;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  setTrackPrefill: (prefill: TrackPrefill | null) => void;
}

export const useUI = create<UIState>((set) => ({
  productModalId: null,
  checkoutOpen: false,
  cartOpen: false,
  mobileNavOpen: false,
  trackPrefill: null,
  openProduct: (id) => set({ productModalId: id }),
  closeProduct: () => set({ productModalId: null }),
  openCheckout: () => set({ checkoutOpen: true, cartOpen: false }),
  closeCheckout: () => set({ checkoutOpen: false }),
  openCart: () => set({ cartOpen: true, mobileNavOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen, mobileNavOpen: false })),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setTrackPrefill: (prefill) => set({ trackPrefill: prefill }),
}));
