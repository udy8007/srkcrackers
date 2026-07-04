import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Accept compressed JPEG data URL and persist as a static file (or return as-is on Vercel). */
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

  // Vercel has a read-only filesystem — store compressed image URL in the database instead.
  if (process.env.VERCEL) {
    return NextResponse.json({ imageUrl: dataUrl });
  }

  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const safeName = (filename ?? `product-${Date.now()}`).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const dir = join(process.cwd(), "public", "uploads", "products");
  mkdirSync(dir, { recursive: true });
  const file = `${safeName}.${ext}`;
  writeFileSync(join(dir, file), Buffer.from(match[2], "base64"));

  return NextResponse.json({ imageUrl: `/uploads/products/${file}` });
}
