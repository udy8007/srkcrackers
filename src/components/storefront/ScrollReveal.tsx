"use client";

import { useEffect } from "react";

/**
 * Fade-up for main sections as they enter the viewport.
 * Never leaves #products (or the current hash target) stuck at opacity:0 —
 * that caused blank product lists on mobile when opening /#products.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = (section: HTMLElement) => {
      section.classList.remove("reveal");
      section.classList.add("in");
    };

    const hashSection = (): HTMLElement | null => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return null;
      const el = document.getElementById(id);
      if (!el) return null;
      if (el.matches("main > section")) return el;
      return el.closest("main > section");
    };

    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.02, rootMargin: "0px 0px -4% 0px" },
    );

    const target = hashSection();

    sections.forEach((section) => {
      // Critical storefront section — never pre-hide (hash jumps + late catalog load).
      if (section.id === "products") {
        show(section);
        return;
      }

      if (target && section === target) {
        show(section);
        return;
      }

      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        show(section);
        return;
      }

      section.classList.add("reveal");
      observer.observe(section);
    });

    const onHash = () => {
      const section = hashSection();
      if (section) show(section);
    };
    window.addEventListener("hashchange", onHash);

    // Re-check after layout/catalog paint (mobile hash scroll is often late).
    const t1 = window.setTimeout(onHash, 50);
    const t2 = window.setTimeout(onHash, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHash);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return null;
}
