import { NextRequest, NextResponse } from "next/server";
import { resolveProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() ?? undefined;
    const idsParam = searchParams.get("ids")?.trim();
    const ids = idsParam ? idsParam.split(",").map((id) => id.trim()).filter(Boolean) : [];

    const products = await resolveProducts({ ids, slug });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products/resolve failed:", error);
    return NextResponse.json({ error: "Failed to resolve products" }, { status: 500 });
  }
}
