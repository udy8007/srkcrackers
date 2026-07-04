"use client";

import { useEffect } from "react";

/**
 * Adds a subtle fade-up animation to each <section> as it scrolls into view.
 * The hidden state is applied via JS only, so server-rendered content stays
 * visible for no-JS users and search engines. Sections already in view on load
 * are left untouched to avoid an above-the-fold flash.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      // Skip elements already visible on load (e.g. the hero) to avoid a flash.
      if (rect.top < window.innerHeight * 0.85) return;
      section.classList.add("reveal");
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
