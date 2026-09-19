import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPhone } from "@/lib/utils";
import { canCustomerRequestCancel } from "@/lib/order-status";
import { dispatchNotification, notifyOrderCancelRequested } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const MAX_REASON_CHARS = 500;

export async function POST(request: NextRequest) {
  let body: { orderNumber?: string; phone?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim().toUpperCase();
  const phone = body.phone?.trim();
  const reason = body.reason?.trim().slice(0, MAX_REASON_CHARS) ?? "";

  if (!orderNumber || !isValidPhone(phone ?? "")) {
    return NextResponse.json(
      { error: "Enter a valid Order ID and 10-digit mobile number" },
      { status: 400 },
    );
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, phone },
    select: { id: true, orderNumber: true, status: true, cancelStatus: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!canCustomerRequestCancel(order.status)) {
    return NextResponse.json(
      { error: "This order cannot be cancelled at this stage. Contact us for help." },
      { status: 400 },
    );
  }

  if (order.cancelStatus === "PENDING") {
    return NextResponse.json(
      { error: "A cancellation request is already under review." },
      { status: 409 },
    );
  }

  if (order.cancelStatus === "APPROVED" || order.status === "CANCELLED") {
    return NextResponse.json({ error: "This order has already been cancelled." }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      cancelRequestedAt: new Date(),
      cancelReason: reason || null,
      cancelStatus: "PENDING",
      cancelDecidedAt: null,
      cancelAdminNote: null,
    },
  });

  dispatchNotification(() => notifyOrderCancelRequested(order.id, reason));

  return NextResponse.json({
    ok: true,
    message: "Cancellation request sent. Our team will contact you shortly.",
  });
}