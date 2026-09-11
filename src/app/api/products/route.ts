import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_PRODUCTS_PAGE_SIZE,
  getCatalog,
  getCategoryMeta,
  getProductsPage,
  MAX_PRODUCTS_PAGE_SIZE,
  STOREFRONT_CATALOG_REVALIDATE_SECONDS,
} from "@/lib/catalog";

/** Must match STOREFRONT_CATALOG_REVALIDATE_SECONDS in @/lib/catalog */
export const revalidate = 300;

const CATALOG_CACHE_CONTROL = `public, s-maxage=${STOREFRONT_CATALOG_REVALIDATE_SECONDS}, stale-while-revalidate=600`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get("full") === "1";

    if (full) {
      const catalog = await getCatalog();
      return NextResponse.json(
        { categories: catalog },
        { headers: { "Cache-Control": CATALOG_CACHE_CONTROL } },
      );
    }

    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Math.min(
      Number(searchParams.get("pageSize")) || DEFAULT_PRODUCTS_PAGE_SIZE,
      MAX_PRODUCTS_PAGE_SIZE,
    );
    const category = searchParams.get("category") ?? undefined;
    const excludeCategory = searchParams.get("excludeCategory") ?? undefined;
    const query = searchParams.get("q")?.trim() ?? undefined;

    const [categories, pageResult] = await Promise.all([
      getCategoryMeta(),
      getProductsPage({ page, pageSize, category, excludeCategory, query }),
    ]);

    return NextResponse.json(
      { categories, ...pageResult },
      { headers: { "Cache-Control": CATALOG_CACHE_CONTROL } },
    );
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
