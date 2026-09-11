import { NextRequest, NextResponse } from "next/server";
import { resolveProducts, STOREFRONT_CATALOG_REVALIDATE_SECONDS } from "@/lib/catalog";

export const revalidate = 300;

const CACHE_CONTROL = `public, s-maxage=${STOREFRONT_CATALOG_REVALIDATE_SECONDS}, stale-while-revalidate=600`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() ?? undefined;
    const idsParam = searchParams.get("ids")?.trim();
    const ids = idsParam ? idsParam.split(",").map((id) => id.trim()).filter(Boolean) : [];

    const products = await resolveProducts({ ids, slug });
    return NextResponse.json({ products }, { headers: { "Cache-Control": CACHE_CONTROL } });
  } catch (error) {
    console.error("GET /api/products/resolve failed:", error);
    return NextResponse.json(
      { error: "Failed to resolve products" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
