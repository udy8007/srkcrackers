"use client";

import { useEffect } from "react";
import type { CategoryWithProductsDTO } from "@/types";
import { CatalogProvider } from "./catalog-context";
import { useUI } from "@/store/ui";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { MarqueeBars } from "./Marquee";
import { Hero } from "./Hero";
import { Highlights } from "./Highlights";
import { ProductsSection } from "./ProductsSection";
import { HowToOrder } from "./HowToOrder";
import { TrackOrder } from "./TrackOrder";
import { LicenseInfo } from "./LicenseInfo";
import { ShopShowcase } from "./ShopShowcase";
import { MapSection } from "./MapSection";
import { Footer } from "./Footer";
import { StickyBar } from "./StickyBar";
import { CheckoutModal } from "./CheckoutModal";
import { ProductModal } from "./ProductModal";
import { FloatingDock } from "./FloatingDock";
import { ScrollReveal } from "./ScrollReveal";
import { VisitTracker } from "./VisitTracker";
import { Toast } from "./Toast";
import { NoupeEmbed } from "./NoupeEmbed";

export function Storefront({ categories }: { categories: CategoryWithProductsDTO[] }) {
  const closeProduct = useUI((s) => s.closeProduct);
  const closeCheckout = useUI((s) => s.closeCheckout);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProduct();
        closeCheckout();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeProduct, closeCheckout]);

  return (
    <CatalogProvider categories={categories}>
      <div className="pb-sticky">
        <TopBar />
        <Header />
        <MarqueeBars />
        <main>
          <Hero />
          <Highlights />
          <ProductsSection />
          <HowToOrder />
          <TrackOrder />
          <LicenseInfo />
          <ShopShowcase />
          <MapSection />
        </main>
        <Footer />
      </div>

      <ScrollReveal />
      <VisitTracker />
      <StickyBar />
      <FloatingDock />
      <NoupeEmbed />
      <ProductModal />
      <CheckoutModal />
      <Toast />
    </CatalogProvider>
  );
}
