import { create } from "zustand";

export interface TrackPrefill {
  orderNumber: string;
  phone: string;
}

interface OpenProductOptions {
  navIds?: string[];
}

interface UIState {
  productModalId: string | null;
  productModalNavIds: string[] | null;
  checkoutOpen: boolean;
  cartOpen: boolean;
  wishlistOpen: boolean;
  mobileNavOpen: boolean;
  trackPrefill: TrackPrefill | null;
  openProduct: (id: string, options?: OpenProductOptions) => void;
  closeProduct: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  setTrackPrefill: (prefill: TrackPrefill | null) => void;
}

export const useUI = create<UIState>((set) => ({
  productModalId: null,
  productModalNavIds: null,
  checkoutOpen: false,
  cartOpen: false,
  wishlistOpen: false,
  mobileNavOpen: false,
  trackPrefill: null,
  openProduct: (id, options) =>
    set((state) => ({
      productModalId: id,
      productModalNavIds: options?.navIds ?? state.productModalNavIds,
    })),
  closeProduct: () => set({ productModalId: null, productModalNavIds: null }),
  openCheckout: () => set({ checkoutOpen: true, cartOpen: false, wishlistOpen: false }),
  closeCheckout: () => set({ checkoutOpen: false }),
  openCart: () => set({ cartOpen: true, wishlistOpen: false, mobileNavOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () =>
    set((state) => ({
      cartOpen: !state.cartOpen,
      wishlistOpen: false,
      mobileNavOpen: false,
    })),
  openWishlist: () => set({ wishlistOpen: true, cartOpen: false, mobileNavOpen: false }),
  closeWishlist: () => set({ wishlistOpen: false }),
  toggleWishlist: () =>
    set((state) => ({
      wishlistOpen: !state.wishlistOpen,
      cartOpen: false,
      mobileNavOpen: false,
    })),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setTrackPrefill: (prefill) => set({ trackPrefill: prefill }),
}));
