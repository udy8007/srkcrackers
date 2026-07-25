import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { visible?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.visible !== "boolean") {
    return NextResponse.json({ error: "Provide visible true/false" }, { status: 400 });
  }

  try {
    const review = await prisma.productReview.update({
      where: { id },
      data: { visible: body.visible },
      include: {
        product: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    await writeAuditLog({
      actor: actorFromSession(session.user),
      action: body.visible ? "REVIEW_SHOW" : "REVIEW_HIDE",
      entityType: "review",
      entityId: review.id,
      summary: `${body.visible ? "Restored" : "Hid"} review for "${review.product.name}" (${review.order.orderNumber})`,
      metadata: {
        productId: review.product.id,
        orderId: review.order.id,
        rating: review.rating,
        visible: review.visible,
      },
    });

    return NextResponse.json({
      id: review.id,
      visible: review.visible,
      rating: review.rating,
      text: review.text,
      reviewerName: review.reviewerName,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      product: review.product,
      order: review.order,
    });
  } catch {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
}
