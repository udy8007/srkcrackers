"use client";

import Image from "next/image";
import { useCart, selectCartCount } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { useMounted } from "@/lib/hooks";
import { downloadApk, scrollToId } from "@/lib/client-actions";
import { BUSINESS } from "@/lib/constants";
import { NAV_LINKS } from "./nav";

export function Header() {
  const items = useCart((state) => state.items);
  const mobileNavOpen = useUI((state) => state.mobileNavOpen);
  const toggleMobileNav = useUI((state) => state.toggleMobileNav);
  const closeMobileNav = useUI((state) => state.closeMobileNav);
  const showToast = useToast((state) => state.show);
  const mounted = useMounted();
  const count = mounted ? selectCartCount(items) : 0;

  const handleApk = () => {
    downloadApk();
    showToast("Downloading SRK Crackers App (demo APK)...");
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-dark via-primary to-primary-dark shadow-[0_2px_14px_rgba(157,2,8,0.4)]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 py-3">
        <a href="#home" className="flex min-w-0 items-center gap-2.5 overflow-hidden text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow via-gold to-orange p-[2.5px] shadow-[0_0_14px_rgba(255,195,0,0.55)]">
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
            <span className="block truncate font-display text-[1.35rem] font-bold leading-tight">
              {BUSINESS.name}
            </span>
            <span className="block text-[0.68rem] opacity-90">{BUSINESS.tagline}</span>
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
            onClick={() => scrollToId("products")}
            className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-yellow px-3 text-[0.85rem] font-bold text-primary-dark transition hover:brightness-105"
          >
            <span className="hidden sm:inline">Cart</span>
            <span>{count}</span>
          </button>

          <button
            type="button"
            onClick={handleApk}
            title="Download SRK Crackers App"
            className="hidden h-11 items-center justify-center rounded-lg border-2 border-yellow bg-white px-3 text-[0.78rem] font-bold whitespace-nowrap text-primary-dark transition hover:bg-yellow hover:text-black sm:flex"
          >
            Download APK
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
          <button
            type="button"
            onClick={() => {
              handleApk();
              closeMobileNav();
            }}
            className="rounded-md px-3 py-2.5 text-left text-[0.9rem] text-white hover:bg-white/10"
          >
            📲 Download APK
          </button>
        </div>
      )}
    </header>
  );
}
