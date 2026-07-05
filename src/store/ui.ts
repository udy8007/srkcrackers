import { create } from "zustand";

export interface TrackPrefill {
  orderNumber: string;
  phone: string;
}

interface UIState {
  productModalId: string | null;
  checkoutOpen: boolean;
  mobileNavOpen: boolean;
  trackPrefill: TrackPrefill | null;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  setTrackPrefill: (prefill: TrackPrefill | null) => void;
}

export const useUI = create<UIState>((set) => ({
  productModalId: null,
  checkoutOpen: false,
  mobileNavOpen: false,
  trackPrefill: null,
  openProduct: (id) => set({ productModalId: id }),
  closeProduct: () => set({ productModalId: null }),
  openCheckout: () => set({ checkoutOpen: true }),
  closeCheckout: () => set({ checkoutOpen: false }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setTrackPrefill: (prefill) => set({ trackPrefill: prefill }),
}));
