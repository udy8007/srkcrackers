import type { ProductDTO } from "@/types";

/** Matches server `STOREFRONT_CATALOG_REVALIDATE_SECONDS` — admin updates appear after this delay. */
export const STOREFRONT_FEED_CACHE_TTL_MS = 300_000;

export const PRODUCT_FEED_PAGE_SIZE = 10;

export interface CachedFeedPage {
  products: ProductDTO[];
  total: number;
  totalPages: number;
  fetchedAt: number;
}

interface FeedCacheKeyInput {
  category: string;
  search: string;
  page: number;
  excludeCategory?: string;
}

const feedCache = new Map<string, CachedFeedPage>();

export function feedCacheKey(input: FeedCacheKeyInput): string {
  const exclude = input.excludeCategory ?? "";
  return `${input.category}|${input.search}|${exclude}|${input.page}`;
}

function isFresh(entry: CachedFeedPage): boolean {
  return Date.now() - entry.fetchedAt < STOREFRONT_FEED_CACHE_TTL_MS;
}

/** Returns a fresh cached page, or null if missing/expired. */
export function getCachedFeedPage(key: string): CachedFeedPage | null {
  const entry = feedCache.get(key);
  if (!entry || !isFresh(entry)) return null;
  return entry;
}

export function setCachedFeedPage(
  key: string,
  data: Pick<CachedFeedPage, "products" | "total" | "totalPages">,
): void {
  feedCache.set(key, { ...data, fetchedAt: Date.now() });
}

/** Clear client feed cache (e.g. after long idle). */
export function clearStorefrontFeedCache(): void {
  feedCache.clear();
}
