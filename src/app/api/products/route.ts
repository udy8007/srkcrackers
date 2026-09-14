import { NextRequest, NextResponse } from "next/server";
import { getCatalog, getCategoryMeta, getFilteredProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const full = searchParams.get("full") === "1";

    if (full) {
      const catalog = await getCatalog();
      return NextResponse.json({ categories: catalog });
    }

    const category = searchParams.get("category") ?? undefined;
    const excludeCategory = searchParams.get("excludeCategory") ?? undefined;
    const query = searchParams.get("q")?.trim() ?? undefined;

    const [categories, result] = await Promise.all([
      getCategoryMeta(),
      getFilteredProducts({ category, excludeCategory, query }),
    ]);

    return NextResponse.json({ categories, ...result });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
