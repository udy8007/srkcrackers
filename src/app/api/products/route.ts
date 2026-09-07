import { NextResponse } from "next/server";
import { getCatalog, STOREFRONT_CATALOG_REVALIDATE_SECONDS } from "@/lib/catalog";

/** Must match STOREFRONT_CATALOG_REVALIDATE_SECONDS in @/lib/catalog */
export const revalidate = 300;

const CATALOG_CACHE_CONTROL = `public, s-maxage=${STOREFRONT_CATALOG_REVALIDATE_SECONDS}, stale-while-revalidate=600`;

export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json(
      { categories: catalog },
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
