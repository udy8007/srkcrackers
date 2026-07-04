import { create } from "zustand";

export interface TrackPrefill {
  orderNumber: string;
  phone: string;
}

interface UIState {
  productModalId: string | null;
  checkoutOpen: boolean;
  chatOpen: boolean;
  mobileNavOpen: boolean;
  trackPrefill: TrackPrefill | null;
  openProduct: (id: string) => void;
  closeProduct: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  toggleChat: () => void;
  setChat: (open: boolean) => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  setTrackPrefill: (prefill: TrackPrefill | null) => void;
}

export const useUI = create<UIState>((set) => ({
  productModalId: null,
  checkoutOpen: false,
  chatOpen: false,
  mobileNavOpen: false,
  trackPrefill: null,
  openProduct: (id) => set({ productModalId: id }),
  closeProduct: () => set({ productModalId: null }),
  openCheckout: () => set({ checkoutOpen: true }),
  closeCheckout: () => set({ checkoutOpen: false }),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  setChat: (open) => set({ chatOpen: open }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setTrackPrefill: (prefill) => set({ trackPrefill: prefill }),
}));
