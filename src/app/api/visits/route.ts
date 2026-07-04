import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Record a storefront visit (city/time from Vercel geo headers when available). */
export async function POST(request: NextRequest) {
  let path = "/";
  try {
    const body = await request.json();
    if (typeof body?.path === "string" && body.path.startsWith("/")) {
      path = body.path.slice(0, 200);
    }
  } catch {
    // optional body
  }

  const city =
    request.headers.get("x-vercel-ip-city") ??
    request.headers.get("cf-ipcity") ??
    null;
  const region =
    request.headers.get("x-vercel-ip-country-region") ??
    request.headers.get("cf-region") ??
    null;
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  try {
    await prisma.siteVisit.create({
      data: { path, city, region, country, userAgent },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
