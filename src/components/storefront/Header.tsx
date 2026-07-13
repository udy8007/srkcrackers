"use client";

import Image from "next/image";
import { useCart, selectCartCount } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useMounted } from "@/lib/hooks";
import { BUSINESS } from "@/lib/constants";
import { NAV_LINKS } from "./nav";

export function Header() {
  const items = useCart((state) => state.items);
  const mobileNavOpen = useUI((state) => state.mobileNavOpen);
  const toggleMobileNav = useUI((state) => state.toggleMobileNav);
  const closeMobileNav = useUI((state) => state.closeMobileNav);
  const toggleCart = useUI((state) => state.toggleCart);
  const cartOpen = useUI((state) => state.cartOpen);
  const mounted = useMounted();
  const count = mounted ? selectCartCount(items) : 0;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-dark via-primary to-primary-dark shadow-[0_2px_14px_rgba(157,2,8,0.4)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:px-5">
        <a
          href="#home"
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-white lg:flex-initial"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow via-gold to-orange p-[2.5px] shadow-[0_0_14px_rgba(255,195,0,0.55)] sm:h-12 sm:w-12">
            <Image
              src="/logo.png"
              alt={`${BUSINESS.name} logo`}
              width={48}
              height={48}
              priority
              className="h-full w-full rounded-full bg-black object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-bold leading-tight sm:text-[1.35rem] lg:truncate">
              {BUSINESS.name}
            </span>
            <span className="block truncate text-[0.65rem] opacity-90 sm:text-[0.68rem]">
              {BUSINESS.tagline}
            </span>
          </span>
        </a>

        <nav className="hidden min-w-0 flex-1 justify-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3.5 py-1.5 text-[0.85rem] font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleCart}
            aria-label="View cart"
            aria-expanded={cartOpen}
            className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-yellow px-3 text-[0.85rem] font-bold text-primary-dark transition hover:brightness-105"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="9" cy="20" r="1.6" />
              <circle cx="18" cy="20" r="1.6" />
              <path d="M2.5 3h2.2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L20.5 7H6" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] font-bold text-white">
              {count}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow text-primary-dark shadow-md lg:hidden"
          >
            <span className="flex h-3.5 w-5 flex-col justify-between">
              <span className="h-[2.5px] w-full rounded bg-current" />
              <span className="h-[2.5px] w-full rounded bg-current" />
              <span className="h-[2.5px] w-full rounded bg-current" />
            </span>
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="flex flex-col gap-1 bg-primary-dark px-4 py-3 lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={closeMobileNav}
              className="rounded-md px-3 py-2.5 text-[0.9rem] text-white hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
