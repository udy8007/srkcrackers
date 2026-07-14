import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json(
      { categories: catalog },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
