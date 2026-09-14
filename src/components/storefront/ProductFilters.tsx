"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CategoryMetaDTO } from "@/types";

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

function getCategoryIcon(key: string): string {
  if (key === "all") return "🎆";
  if (key.includes("sparkler")) return "✨";
  if (key.includes("match")) return "🔥";
  if (key.includes("sky") || key.includes("fancy")) return "🎇";
  if (key.includes("ground")) return "🌟";
  if (key.includes("rocket")) return "🚀";
  if (key.includes("fountain") || key.includes("flower")) return "🌸";
  if (key.includes("bomb")) return "💥";
  if (key.includes("sound") || key.includes("lakshmi")) return "🔊";
  if (key.includes("kid")) return "🎈";
  if (key.includes("wala") || key.includes("garland")) return "📿";
  if (key.includes("gift")) return "🎁";
  return "🧨";
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

      <FilterFloatingPortal active={filterStuck}>
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
      <div
        aria-hidden
        className={`pointer-events-none absolute rounded-full bg-yellow/30 blur-2xl ${
          compact ? "-left-4 -top-6 h-16 w-16" : "-left-6 -top-8 h-28 w-28"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute rounded-full bg-primary/20 blur-2xl ${
          compact ? "-bottom-4 -right-4 h-20 w-20" : "-bottom-10 -right-6 h-32 w-32"
        }`}
      />
      <svg
        aria-hidden
        className={`pointer-events-none absolute text-primary/[0.07] ${
          compact ? "right-3 top-2 h-10 w-10" : "right-4 top-3 h-16 w-16"
        }`}
        viewBox="0 0 64 64"
        fill="currentColor"
      >
        <path d="M32 4l2 10 10 2-10 2-2 10-2-10-10-2 10-2 2-10zm18 18l1.5 6 6 1.5-6 1.5-1.5 6-1.5-6-6-1.5 6-1.5 1.5-6zM12 40l1 4 4 1-4 1-1 4-1-4-4-1 4-1 1-4z" />
      </svg>
      {!compact && (
        <>
          <span aria-hidden className="product-filter-spark product-filter-spark--1 absolute text-lg">
            ✨
          </span>
          <span aria-hidden className="product-filter-spark product-filter-spark--2 absolute text-base">
            🎇
          </span>
          <span aria-hidden className="product-filter-spark product-filter-spark--3 absolute text-sm">
            ✦
          </span>
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
              className={`product-filter-badge flex shrink-0 items-center justify-center rounded-2xl shadow-md ${
                compact ? "h-10 w-10 text-xl" : "h-12 w-12 text-2xl"
              }`}
            >
              🎆
            </div>
            <div className="min-w-0">
              <p className={`font-display font-bold text-ink ${compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
                Browse categories
              </p>
              {!compact && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  Choose a category or search for a product
                </p>
              )}
            </div>
          </div>

          <div className={`product-filter-count shrink-0 text-center ${compact ? "rounded-full px-3 py-1.5" : "rounded-2xl px-4 py-2"}`}>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary/75">
              Found
            </p>
            <p className={`font-display font-extrabold tabular-nums text-primary ${compact ? "text-sm" : "text-xl"}`}>
              {isInitialLoad ? "…" : productsCount}
            </p>
          </div>
        </div>

        <MobileCategorySelect
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          totalProducts={totalProducts}
          shopCategories={shopCategories}
          giftPackCategory={giftPackCategory}
          onGiftBoxesClick={onGiftBoxesClick}
        />

        <div
          className={`product-filter-chips hidden sm:flex ${
            compact ? "scrollbar-thin flex-nowrap overflow-x-auto pb-1" : "flex-wrap"
          }`}
        >
          <FilterChip
            active={selectedCategory === "all"}
            icon={getCategoryIcon("all")}
            label="All"
            count={totalProducts}
            onClick={() => onCategoryChange("all")}
          />
          {shopCategories.map((category) => (
            <FilterChip
              key={category.key}
              active={selectedCategory === category.key}
              icon={getCategoryIcon(category.key)}
              label={category.label}
              count={category.productCount}
              onClick={() => onCategoryChange(category.key)}
            />
          ))}
          {giftPackCategory && (
            <button
              type="button"
              onClick={onGiftBoxesClick}
              className="product-filter-chip product-filter-chip--gift inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition"
            >
              <span aria-hidden>🎁</span>
              Gift Boxes
              <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-[0.65rem] text-primary">
                {giftPackCategory.productCount}
              </span>
            </button>
          )}
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
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Jump to filters"
      className="product-filter-gear-fab fixed z-[55] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition"
    >
      <GearIcon className="h-7 w-7" />
      {hasActiveFilter && (
        <span className="product-filter-gear-badge absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.62rem] font-extrabold">
          {isInitialLoad ? "…" : productsCount > 99 ? "99+" : productsCount}
        </span>
      )}
    </button>
  );
}

function MobileCategorySelect({
  selectedCategory,
  onCategoryChange,
  totalProducts,
  shopCategories,
  giftPackCategory,
  onGiftBoxesClick,
}: {
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  totalProducts: number;
  shopCategories: CategoryMetaDTO[];
  giftPackCategory?: CategoryMetaDTO;
  onGiftBoxesClick: () => void;
}) {
  return (
    <div className="mb-4 sm:hidden">
      <label htmlFor="product-category" className="sr-only">
        Product category
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base"
          aria-hidden
        >
          {getCategoryIcon(selectedCategory)}
        </span>
        <select
          id="product-category"
          value={selectedCategory}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "gift-packs") {
              onGiftBoxesClick();
              return;
            }
            onCategoryChange(value);
          }}
          className="product-filter-select w-full appearance-none rounded-2xl py-3 pl-10 pr-10 text-sm font-bold text-ink outline-none"
        >
          <option value="all">All products ({totalProducts})</option>
          {shopCategories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label} ({category.productCount})
            </option>
          ))}
          {giftPackCategory && (
            <option value="gift-packs">
              Gift Boxes ({giftPackCategory.productCount}) — go to section
            </option>
          )}
        </select>
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary"
          aria-hidden
        >
          ▾
        </span>
      </div>
    </div>
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
          compact ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
        }`}
      >
        🔍
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
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`product-filter-chip inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
        active ? "product-filter-chip--active" : ""
      }`}
    >
      <span className="product-filter-chip-icon flex h-7 w-7 items-center justify-center rounded-full text-sm">
        {icon}
      </span>
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
          active ? "bg-white/25 text-white" : "bg-white text-ink-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

