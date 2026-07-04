import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(ORDER_STATUSES.map((s) => s.key));

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
  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const status = body.status as OrderStatus | undefined;
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          label: ORDER_STATUS_LABEL[status],
          note: body.note?.trim() || null,
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

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; statusHistory: true };
}>;

function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
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
