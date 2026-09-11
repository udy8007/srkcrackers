import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sqliteContains } from "@/lib/sqlite-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const visibility = searchParams.get("visibility") ?? "all";
  const take = Math.min(Number(searchParams.get("take")) || 25, 100);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const where: Record<string, unknown> = {};
  if (visibility === "visible") where.visible = true;
  if (visibility === "hidden") where.visible = false;
  if (q) {
    where.OR = [
      { reviewerName: sqliteContains(q) },
      { text: sqliteContains(q) },
      { order: { orderNumber: sqliteContains(q) } },
      { product: { name: sqliteContains(q) } },
    ];
  }

  const [reviews, total, visibleCount, hiddenCount] = await Promise.all([
    prisma.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        order: { select: { id: true, orderNumber: true, phone: true, customerName: true } },
      },
    }),
    prisma.productReview.count({ where }),
    prisma.productReview.count({ where: { visible: true } }),
    prisma.productReview.count({ where: { visible: false } }),
  ]);

  return NextResponse.json({
    items: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      reviewerName: review.reviewerName,
      visible: review.visible,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      product: review.product,
      order: {
        id: review.order.id,
        orderNumber: review.order.orderNumber,
        customerName: review.order.customerName,
        phone: review.order.phone,
      },
    })),
    total,
    take,
    skip,
    counts: {
      all: visibleCount + hiddenCount,
      visible: visibleCount,
      hidden: hiddenCount,
    },
  });
}
