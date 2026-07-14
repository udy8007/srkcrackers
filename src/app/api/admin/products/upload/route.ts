import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadDataUrl } from "@/lib/db/storage";

export const dynamic = "force-dynamic";

/** Accept compressed JPEG data URL and persist as data URL / path (no object storage). */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dataUrl?: string; filename?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dataUrl, filename } = body;
  if (!dataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "Expected a compressed image data URL" }, { status: 400 });
  }

  if (dataUrl.length > 512_000) {
    return NextResponse.json(
      { error: "Image too large after compression. Try a smaller photo or crop closer." },
      { status: 413 },
    );
  }

  try {
    const safeName = (filename ?? `product-${Date.now()}`)
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase()
      .slice(0, 48);
    const imageUrl = await uploadDataUrl(`products/uploads/${safeName}`, dataUrl);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Product image upload failed:", error);
    return NextResponse.json(
      { error: "Failed to save product image" },
      { status: 500 },
    );
  }
}
