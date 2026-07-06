import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { buildOrderFromItems, customerOrderFields, validateCustomer } from "@/lib/order-build";
import { generateOrderNumber } from "@/lib/utils";
import type { CreateOrderInput } from "@/types";

export const dynamic = "force-dynamic";

const MAX_SCREENSHOT_CHARS = 3_000_000; // ~2MB base64 guard

export async function POST(request: NextRequest) {
  let body: CreateOrderInput;
  try {
    body = (await request.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { customer, items, paymentScreenshot, paymentMethod, draftOrderId } = body ?? {};

  const customerError = validateCustomer(customer);
  if (customerError) {
    return NextResponse.json({ error: customerError }, { status: 400 });
  }

  if (paymentScreenshot && paymentScreenshot.length > MAX_SCREENSHOT_CHARS) {
    return NextResponse.json({ error: "Payment screenshot is too large" }, { status: 400 });
  }

  const built = await buildOrderFromItems(items);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status });
  }

  const { orderItems, subtotal, total } = built.data;
  const hasPayment = Boolean(paymentScreenshot);
  const now = new Date();

  if (draftOrderId) {
    const draft = await prisma.order.findFirst({
      where: { id: draftOrderId, status: "PAYMENT_PENDING" },
    });
    if (!draft) {
      return NextResponse.json({ error: "Checkout session expired. Please try again." }, { status: 400 });
    }

    const status: OrderStatus = hasPayment ? "VERIFYING" : "PLACED";
    const history: { status: OrderStatus; label: string; createdAt: Date }[] = [
      { status: "PLACED", label: ORDER_STATUS_LABEL.PLACED, createdAt: now },
    ];
    if (hasPayment) {
      history.push({
        status: "PAYMENT_UPLOADED",
        label: ORDER_STATUS_LABEL.PAYMENT_UPLOADED,
        createdAt: now,
      });
      history.push({ status: "VERIFYING", label: ORDER_STATUS_LABEL.VERIFYING, createdAt: now });
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: draft.id } });
      return tx.order.update({
        where: { id: draft.id },
        data: {
          ...customerOrderFields(customer),
          paymentMethod: paymentMethod?.trim() || draft.paymentMethod,
          upiId: BUSINESS.upiId,
          paymentScreenshot: paymentScreenshot || null,
          subtotal,
          total,
          status,
          items: { create: orderItems },
          statusHistory: { create: history },
        },
        select: { orderNumber: true, subtotal: true, total: true, status: true, createdAt: true },
      });
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      shipping: order.total - order.subtotal,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  }

  const status: OrderStatus = hasPayment ? "VERIFYING" : "PLACED";
  const history: { status: OrderStatus; label: string; createdAt: Date }[] = [
    { status: "PLACED", label: ORDER_STATUS_LABEL.PLACED, createdAt: now },
  ];
  if (hasPayment) {
    history.push({ status: "PAYMENT_UPLOADED", label: ORDER_STATUS_LABEL.PAYMENT_UPLOADED, createdAt: now });
    history.push({ status: "VERIFYING", label: ORDER_STATUS_LABEL.VERIFYING, createdAt: now });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          ...customerOrderFields(customer),
          paymentMethod: paymentMethod?.trim() || "UPI",
          upiId: BUSINESS.upiId,
          paymentScreenshot: paymentScreenshot || null,
          subtotal,
          total,
          status,
          items: { create: orderItems },
          statusHistory: { create: history },
        },
        select: { orderNumber: true, subtotal: true, total: true, status: true, createdAt: true },
      });

      return NextResponse.json(
        {
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          shipping: order.total - order.subtotal,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        },
        { status: 201 },
      );
    } catch (error) {
      const isUniqueViolation =
        (error as Prisma.PrismaClientKnownRequestError)?.code === "P2002";
      if (isUniqueViolation) continue;
      console.error("POST /api/orders failed:", error);
      return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique order number" }, { status: 500 });
}
