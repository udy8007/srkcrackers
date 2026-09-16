"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CategoryMetaDTO } from "@/types";
import {
  Burst,
  Chakkar,
  Firecracker,
  FlowerPot,
  Mandala,
  Marigold,
  Rocket,
  Sparkle,
  Sparkler,
} from "./FestiveDecor";

const FILTER_GEAR_HINT_KEY = "srk-filter-gear-hint";
const MOBILE_MAX_WIDTH = 767;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function FilterFloatingPortal({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !active) return null;
  return createPortal(children, document.body);
}

function GearIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

type CategoryTheme =
  | "all"
  | "sparkler"
  | "match"
  | "sky"
  | "ground"
  | "rocket"
  | "flower"
  | "bomb"
  | "sound"
  | "kid"
  | "wala"
  | "gift"
  | "cracker";

function getCategoryTheme(key: string): CategoryTheme {
  if (key === "all") return "all";
  if (key.includes("gift")) return "gift";
  if (key.includes("sparkler")) return "sparkler";
  if (key.includes("match")) return "match";
  if (key.includes("rocket")) return "rocket";
  if (key.includes("fountain") || key.includes("flower")) return "flower";
  if (key.includes("ground")) return "ground";
  if (key.includes("sky") || key.includes("fancy")) return "sky";
  if (key.includes("bomb")) return "bomb";
  if (key.includes("sound") || key.includes("lakshmi")) return "sound";
  if (key.includes("kid")) return "kid";
  if (key.includes("wala") || key.includes("garland")) return "wala";
  return "cracker";
}

function GiftGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden>
      <path d="M12 24h40v8H12z" />
      <path d="M14 32h36v22a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V32z" />
      <path d="M30 24h4v34h-4z" opacity="0.55" />
      <path d="M32 24c-9-12-18-4-12 6h12" />
      <path d="M32 24c9-12 18-4 12 6H32" />
    </svg>
  );
}

function MatchGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M22 52 40 18" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M37 10c6 2 10 8 8 14-4-1-7-5-8-10-3 2-5 6-5 10-4-6-2-12 5-14z" fill="currentColor" />
    </svg>
  );
}

function SoundGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
      <path d="M18 26h8l12-10v32L26 38h-8a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z" fill="currentColor" stroke="none" />
      <path d="M44 24c3 4 3 12 0 16" strokeLinecap="round" />
      <path d="M50 18c6 7 6 21 0 28" strokeLinecap="round" />
    </svg>
  );
}

function BalloonGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <ellipse cx="32" cy="26" rx="13" ry="16" fill="currentColor" />
      <path d="M32 42v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M27 42h10l-5 5z" fill="currentColor" />
    </svg>
  );
}

function GarlandGlyph({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M10 18c10 16 34 16 44 0" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <rect x="14" y="26" width="7" height="22" rx="2" fill="currentColor" />
      <rect x="28" y="30" width="7" height="22" rx="2" fill="currentColor" />
      <rect x="42" y="26" width="7" height="22" rx="2" fill="currentColor" />
    </svg>
  );
}

function CategoryGlyph({ theme, className = "h-7 w-7" }: { theme: CategoryTheme; className?: string }) {
  switch (theme) {
    case "all":
      return <Burst className={className} />;
    case "sparkler":
      return <Sparkler className={className} />;
    case "match":
      return <MatchGlyph className={className} />;
    case "sky":
      return <Burst className={className} />;
    case "ground":
      return <Chakkar className={className} />;
    case "rocket":
      return <Rocket className={className} />;
    case "flower":
      return <FlowerPot className={className} />;
    case "bomb":
    case "cracker":
      return <Firecracker className={className} />;
    case "sound":
      return <SoundGlyph className={className} />;
    case "kid":
      return <BalloonGlyph className={className} />;
    case "wala":
      return <GarlandGlyph className={className} />;
    case "gift":
      return <GiftGlyph className={className} />;
    default:
      return <Firecracker className={className} />;
  }
}

interface ProductFiltersProps {
  filterStuck: boolean;
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  productsCount: number;
  totalProducts: number;
  shopCategories: CategoryMetaDTO[];
  giftPackCategory?: CategoryMetaDTO;
  isInitialLoad: boolean;
  onGiftBoxesClick: () => void;
}

export function ProductFilters({
  filterStuck,
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  onClearSearch,
  productsCount,
  totalProducts,
  shopCategories,
  giftPackCategory,
  isInitialLoad,
  onGiftBoxesClick,
}: ProductFiltersProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const hasActiveFilter = selectedCategory !== "all" || search.trim().length > 0;

  const scrollToFilters = () => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sharedProps = {
    selectedCategory,
    onCategoryChange,
    search,
    onSearchChange,
    onClearSearch,
    productsCount,
    totalProducts,
    shopCategories,
    giftPackCategory,
    isInitialLoad,
    onGiftBoxesClick,
  };

  return (
    <>
      <div ref={panelRef} className="product-filter-sticky-shell mb-8 scroll-mt-[calc(var(--header-height)+0.5rem)]">
        <FullFilterPanel {...sharedProps} compact={filterStuck} />
      </div>

      <FilterFloatingPortal active={filterStuck && isMobile}>
        <FilterGearFab
          hasActiveFilter={hasActiveFilter}
          productsCount={productsCount}
          isInitialLoad={isInitialLoad}
          onClick={scrollToFilters}
        />
      </FilterFloatingPortal>
    </>
  );
}

type FilterPanelProps = Omit<ProductFiltersProps, "filterStuck">;

function FestiveBackdrop({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div aria-hidden className="product-filter-wash pointer-events-none absolute inset-0" />
      <div aria-hidden className="product-filter-rangoli pointer-events-none absolute inset-0" />
      <Mandala
        className={`pointer-events-none absolute text-primary/[0.08] ${
          compact ? "-right-6 -top-8 h-24 w-24" : "-right-8 -top-10 h-40 w-40"
        }`}
      />
      <Mandala
        className={`pointer-events-none absolute text-gold/20 ${
          compact ? "-bottom-10 -left-8 h-28 w-28" : "-bottom-14 -left-12 h-44 w-44"
        }`}
      />
      <Marigold
        className={`pointer-events-none absolute drop-shadow-sm ${
          compact ? "right-10 top-2 h-5 w-5" : "right-16 top-4 h-7 w-7"
        }`}
      />
      <Sparkler
        className={`pointer-events-none absolute text-gold/35 ${
          compact ? "left-3 bottom-2 h-8 w-8" : "left-4 bottom-3 h-12 w-12"
        }`}
      />
      <Rocket
        className={`pointer-events-none absolute rotate-12 text-primary/15 ${
          compact ? "right-2 bottom-1 h-8 w-8" : "right-3 bottom-2 h-14 w-14"
        }`}
      />
      {!compact && (
        <>
          <Sparkle className="product-filter-spark product-filter-spark--1 absolute h-4 w-4 text-gold" />
          <Sparkle className="product-filter-spark product-filter-spark--2 absolute h-3.5 w-3.5 text-orange" />
          <Sparkle className="product-filter-spark product-filter-spark--3 absolute h-3 w-3 text-primary" />
        </>
      )}
      <div className="product-filter-rim pointer-events-none absolute inset-x-0 top-0" aria-hidden />
    </>
  );
}

function FullFilterPanel({
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  onClearSearch,
  productsCount,
  totalProducts,
  shopCategories,
  giftPackCategory,
  isInitialLoad,
  onGiftBoxesClick,
  compact = false,
}: FilterPanelProps & { compact?: boolean }) {
  return (
    <div className={`product-filter-panel relative overflow-hidden ${compact ? "product-filter-panel--pinned" : ""}`}>
      <FestiveBackdrop compact={compact} />

      <div className={`relative z-[1] ${compact ? "p-3 sm:p-4" : "p-4 sm:p-6"}`}>
        <div className={`flex items-start justify-between gap-3 ${compact ? "mb-3" : "mb-5"}`}>
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`product-filter-badge relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-md ${
                compact ? "h-10 w-10" : "h-12 w-12"
              }`}
            >
              <Burst className={`relative z-[1] text-primary ${compact ? "h-6 w-6" : "h-7 w-7"}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-display font-bold text-ink ${compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
                Browse categories
              </p>
              {!compact && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  Pick a firework type — or search by name
                </p>
              )}
            </div>
          </div>

          <div className={`product-filter-count relative shrink-0 overflow-hidden text-center ${compact ? "rounded-full px-3 py-1.5" : "rounded-2xl px-4 py-2"}`}>
            <Burst className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 text-gold/35" />
            <p className="relative text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary/75">
              Found
            </p>
            <p className={`relative font-display font-extrabold tabular-nums text-primary ${compact ? "text-sm" : "text-xl"}`}>
              {isInitialLoad ? "…" : productsCount}
            </p>
          </div>
        </div>

        <div className={`product-filter-rail ${compact ? "is-compact" : ""}`}>
          <div className={`product-filter-rail-track ${compact ? "product-filter-rail-track--compact" : ""}`}>
            <FilterChip
              active={selectedCategory === "all"}
              theme="all"
              label="All"
              count={totalProducts}
              compact={compact}
              onClick={() => onCategoryChange("all")}
            />
            {shopCategories.map((category) => (
              <FilterChip
                key={category.key}
                active={selectedCategory === category.key}
                theme={getCategoryTheme(category.key)}
                label={category.label}
                count={category.productCount}
                compact={compact}
                onClick={() => onCategoryChange(category.key)}
              />
            ))}
            {giftPackCategory && (
              <FilterChip
                active={false}
                theme="gift"
                label="Gift Boxes"
                count={giftPackCategory.productCount}
                compact={compact}
                onClick={onGiftBoxesClick}
              />
            )}
          </div>
        </div>

        <FilterSearch
          search={search}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
          className={`${compact ? "mt-3 py-2.5" : "mt-4 py-3"}`}
        />
      </div>
    </div>
  );
}

function FilterGearFab({
  hasActiveFilter,
  productsCount,
  isInitialLoad,
  onClick,
}: {
  hasActiveFilter: boolean;
  productsCount: number;
  isInitialLoad: boolean;
  onClick: () => void;
}) {
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(FILTER_GEAR_HINT_KEY) === "1";
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;

    try {
      sessionStorage.setItem(FILTER_GEAR_HINT_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }

    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 3600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHintVisible(false);
          onClick();
        }}
        aria-label="Jump to filters"
        className="product-filter-gear-fab md:hidden fixed z-[55] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition"
      >
        <GearIcon className="h-7 w-7" />
        {hasActiveFilter && (
          <span className="product-filter-gear-badge absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.62rem] font-extrabold">
            {isInitialLoad ? "…" : productsCount > 99 ? "99+" : productsCount}
          </span>
        )}
      </button>
      {hintVisible ? (
        <p className="product-filter-gear-hint md:hidden" role="status">
          Tap to jump back to filters
        </p>
      ) : null}
    </>
  );
}

function FilterSearch({
  search,
  onSearchChange,
  onClearSearch,
  compact = false,
  className = "",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`product-filter-search flex items-center gap-2 ${className}`}>
      <span
        className={`product-filter-search-icon flex shrink-0 items-center justify-center rounded-xl ${
          compact ? "h-8 w-8" : "h-9 w-9"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem] text-primary" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16.5 20.5 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={compact ? "Search…" : "Search crackers by name or pack..."}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
      />
      {search && (
        <button
          type="button"
          onClick={onClearSearch}
          className="shrink-0 rounded-full bg-gradient-to-r from-primary to-primary-dark px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function FilterChip({
  active,
  theme,
  label,
  count,
  compact = false,
  onClick,
}: {
  active: boolean;
  theme: CategoryTheme;
  label: string;
  count: number;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-theme={theme}
      className={`product-filter-tile ${active ? "is-active" : ""} ${compact ? "is-compact" : ""}`}
    >
      <span className="product-filter-tile-burst" aria-hidden />
      <span className="product-filter-tile-art">
        <CategoryGlyph theme={theme} className={compact ? "h-6 w-6" : "h-8 w-8"} />
      </span>
      <span className="product-filter-tile-label">{label}</span>
      <span className="product-filter-tile-count">{count}</span>
    </button>
  );
}

