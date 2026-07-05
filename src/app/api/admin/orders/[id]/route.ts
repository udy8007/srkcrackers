import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/constants";
import { canAdminEditBeforeDispatch } from "@/lib/auto-deliver";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(ORDER_STATUSES.map((s) => s.key));
const MAX_SCREENSHOT_CHARS = 3_000_000;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(serializeOrder(order));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    status?: string;
    note?: string;
    expectedDeliveryAt?: string;
    paymentScreenshot?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const locked =
    existing.status === "DISPATCHED" ||
    existing.status === "DELIVERED" ||
    existing.status === "CANCELLED";

  // Payment screenshot only before dispatch
  if (body.paymentScreenshot !== undefined) {
    if (!canAdminEditBeforeDispatch(existing.status)) {
      return NextResponse.json(
        { error: "Payment screenshot cannot be changed after dispatch" },
        { status: 400 },
      );
    }
    if (body.paymentScreenshot.length > MAX_SCREENSHOT_CHARS) {
      return NextResponse.json({ error: "Screenshot is too large" }, { status: 400 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: { paymentScreenshot: body.paymentScreenshot || null },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json(serializeOrder(order));
  }

  if (locked) {
    return NextResponse.json(
      { error: "Status is locked — parcel is with postal or order is complete" },
      { status: 400 },
    );
  }

  const status = body.status as OrderStatus | undefined;
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "DELIVERED") {
    return NextResponse.json(
      { error: "Delivered status is set automatically after expected delivery time" },
      { status: 400 },
    );
  }

  let expectedDeliveryAt: Date | null | undefined;
  if (status === "DISPATCHED") {
    if (!body.expectedDeliveryAt) {
      return NextResponse.json(
        { error: "Expected delivery date is required when marking as dispatched" },
        { status: 400 },
      );
    }
    expectedDeliveryAt = new Date(body.expectedDeliveryAt);
    if (Number.isNaN(expectedDeliveryAt.getTime())) {
      return NextResponse.json({ error: "Invalid expected delivery date" }, { status: 400 });
    }
  }

  const dispatchNote =
    status === "DISPATCHED"
      ? body.note?.trim() ||
        `Handed to postal — expected delivery ${expectedDeliveryAt!.toLocaleString("en-IN")}`
      : body.note?.trim() || null;

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(status === "DISPATCHED" ? { expectedDeliveryAt } : {}),
      statusHistory: {
        create: {
          status,
          label: ORDER_STATUS_LABEL[status],
          note: dispatchNote,
        },
      },
    },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(serializeOrder(order));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true, orderNumber: true } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ ok: true, orderNumber: existing.orderNumber });
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
    expectedDeliveryAt: order.expectedDeliveryAt?.toISOString() ?? null,
    customer: {
      name: order.customerName,
      phone: order.phone,
      altPhone: order.altPhone,
      email: order.email,
      address: order.address,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      notes: order.notes,
    },
    paymentMethod: order.paymentMethod,
    upiId: order.upiId,
    paymentScreenshot: order.paymentScreenshot,
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      pack: item.pack,
      price: item.price,
      qty: item.qty,
      amount: item.amount,
    })),
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      label: entry.label,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
