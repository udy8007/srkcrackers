"use client";

import { Suspense, useEffect } from "react";
import type { CategoryWithProductsDTO } from "@/types";
import { CatalogProvider } from "./catalog-context";
import { useUI } from "@/store/ui";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { MarqueeBars } from "./Marquee";
import { Hero } from "./Hero";
import { Highlights } from "./Highlights";
import { CustomerFeedback } from "./CustomerFeedback";
import { ProductsSection } from "./ProductsSection";
import { HowToOrder } from "./HowToOrder";
import { TrackOrder } from "./TrackOrder";
import { TrackOrderDeepLink } from "./TrackOrderDeepLink";
import { LicenseInfo } from "./LicenseInfo";
import { ShopShowcase } from "./ShopShowcase";
import { VideoShowcase } from "./VideoShowcase";
import { MapSection } from "./MapSection";
import { Footer } from "./Footer";
import { StickyBar } from "./StickyBar";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { ProductModal } from "./ProductModal";
import { FloatingDock } from "./FloatingDock";
import { ScrollReveal } from "./ScrollReveal";
import { VisitTracker } from "./VisitTracker";
import { Toast } from "./Toast";

export function Storefront({ categories }: { categories: CategoryWithProductsDTO[] }) {
  const closeProduct = useUI((s) => s.closeProduct);
  const closeCheckout = useUI((s) => s.closeCheckout);
  const closeCart = useUI((s) => s.closeCart);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProduct();
        closeCheckout();
        closeCart();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeProduct, closeCheckout, closeCart]);

  return (
    <CatalogProvider categories={categories}>
      <Suspense fallback={null}>
        <TrackOrderDeepLink />
      </Suspense>
      <div className="overflow-x-hidden pb-sticky">
        <TopBar />
        <Header />
        <MarqueeBars />
        <main className="min-w-0">
          <Hero />
          <Highlights />
          <ProductsSection />
          <HowToOrder />
          <TrackOrder />
          <LicenseInfo />
          <ShopShowcase />
          <VideoShowcase />
          <MapSection />
          <CustomerFeedback />
        </main>
        <Footer />
      </div>

      <ScrollReveal />
      <VisitTracker />
      <StickyBar />
      <FloatingDock />
      <CartDrawer />
      <ProductModal />
      <CheckoutModal />
      <Toast />
    </CatalogProvider>
  );
}
