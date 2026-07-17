import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { buildOrderFromItems, customerOrderFields, validateCustomer } from "@/lib/order-build";
import { generateOrderNumber } from "@/lib/utils";
import type { CustomerInput, CartLineInput } from "@/types";

export const dynamic = "force-dynamic";

const DRAFT_WINDOW_MS = 2 * 60 * 60 * 1000;

interface DraftOrderInput {
  customer: CustomerInput;
  items: CartLineInput[];
  draftOrderId?: string;
  paymentMethod?: string;
  checkoutStep?: "PAYMENT" | "REFERENCE";
}

export async function POST(request: NextRequest) {
  let body: DraftOrderInput;
  try {
    body = (await request.json()) as DraftOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { customer, items, draftOrderId, paymentMethod, checkoutStep } = body ?? {};
  const customerError = validateCustomer(customer);
  if (customerError) {
    return NextResponse.json({ error: customerError }, { status: 400 });
  }

  const built = await buildOrderFromItems(items);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status });
  }

  const { orderItems, subtotal, total } = built.data;
  const stepNote =
    checkoutStep === "REFERENCE"
      ? "Reached UPI reference step — payment not confirmed yet"
      : paymentMethod && paymentMethod !== "UPI QR"
        ? `Opened ${paymentMethod} — payment not completed`
        : "Reached payment step — awaiting UPI payment";

  const existing = draftOrderId
    ? await prisma.order.findFirst({
        where: { id: draftOrderId, status: "PAYMENT_PENDING" },
      })
    : await prisma.order.findFirst({
        where: {
          phone: customer.phone.trim(),
          status: "PAYMENT_PENDING",
          createdAt: { gte: new Date(Date.now() - DRAFT_WINDOW_MS) },
        },
        orderBy: { createdAt: "desc" },
      });

  if (existing) {
    await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...customerOrderFields(customer),
        paymentMethod: paymentMethod?.trim() || existing.paymentMethod,
        upiId: BUSINESS.upiId,
        subtotal,
        total,
        items: { create: orderItems },
        statusHistory: {
          create: {
            status: "PAYMENT_PENDING",
            label: ORDER_STATUS_LABEL.PAYMENT_PENDING,
            note: stepNote,
          },
        },
      },
    });

    return NextResponse.json({
      draftOrderId: updated.id,
      orderNumber: updated.orderNumber,
      subtotal: updated.subtotal,
      shipping: updated.total - updated.subtotal,
      total: updated.total,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          ...customerOrderFields(customer),
          paymentMethod: paymentMethod?.trim() || "UPI QR",
          upiId: BUSINESS.upiId,
          subtotal,
          total,
          status: "PAYMENT_PENDING",
          items: { create: orderItems },
          statusHistory: {
            create: {
              status: "PAYMENT_PENDING",
              label: ORDER_STATUS_LABEL.PAYMENT_PENDING,
              note: stepNote,
            },
          },
        },
      });

      return NextResponse.json(
        {
          draftOrderId: order.id,
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
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.toLowerCase().includes("unique") || msg.includes("already exists")) continue;
      console.error("POST /api/orders/draft failed:", error);
      return NextResponse.json({ error: "Failed to save checkout" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique order number" }, { status: 500 });
}
