import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sqliteContains } from "@/lib/sqlite-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";
  const take = Math.min(Number(searchParams.get("take")) || 25, 100);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const where: Record<string, unknown> = {};
  if (status === "PENDING" || status === "RESOLVED") {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { enquiryNumber: sqliteContains(q) },
      { name: sqliteContains(q) },
      { phone: sqliteContains(q) },
      { email: sqliteContains(q) },
      { message: sqliteContains(q) },
    ];
  }

  const [items, total, pendingCount, resolvedCount] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.enquiry.count({ where }),
    prisma.enquiry.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "RESOLVED" } }),
  ]);

  return NextResponse.json({
    items: items.map((enquiry) => ({
      id: enquiry.id,
      enquiryNumber: enquiry.enquiryNumber,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      message: enquiry.message,
      status: enquiry.status,
      adminNote: enquiry.adminNote,
      resolvedAt: enquiry.resolvedAt?.toISOString() ?? null,
      createdAt: enquiry.createdAt.toISOString(),
      updatedAt: enquiry.updatedAt.toISOString(),
    })),
    total,
    take,
    skip,
    counts: {
      all: pendingCount + resolvedCount,
      PENDING: pendingCount,
      RESOLVED: resolvedCount,
    },
  });
}
