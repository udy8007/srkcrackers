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
import { Chatbot } from "./Chatbot";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { ScrollReveal } from "./ScrollReveal";
import { VisitTracker } from "./VisitTracker";
import { Toast } from "./Toast";

export function Storefront({ categories }: { categories: CategoryWithProductsDTO[] }) {
  const closeProduct = useUI((s) => s.closeProduct);
  const closeCheckout = useUI((s) => s.closeCheckout);
  const setChat = useUI((s) => s.setChat);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProduct();
        closeCheckout();
        setChat(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeProduct, closeCheckout, setChat]);

  return (
    <CatalogProvider categories={categories}>
      <div className="pb-28 sm:pb-20">
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
      <WhatsAppFloat />
      <Chatbot />
      <ProductModal />
      <CheckoutModal />
      <Toast />
    </CatalogProvider>
  );
}
