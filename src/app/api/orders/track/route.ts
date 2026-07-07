import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, BUSINESS } from "@/lib/constants";
import { isValidPhone } from "@/lib/utils";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";
import { notifyAutoDelivered } from "@/lib/notifications";
import { dispatchSchedulerTick } from "@/lib/scheduler";
import type { TrackOrderResult } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { orderNumber?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim().toUpperCase();
  const phone = body.phone?.trim();

  if (!orderNumber || !isValidPhone(phone ?? "")) {
    return NextResponse.json(
      { error: "Enter a valid Order ID and 10-digit mobile number" },
      { status: 400 },
    );
  }

  const deliveredIds = await autoDeliverDueOrders();
  notifyAutoDelivered(deliveredIds);
  dispatchSchedulerTick("track");

  const order = await prisma.order.findFirst({
    where: { orderNumber, phone },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const result: TrackOrderResult = {
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABEL[order.status],
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.total - order.subtotal,
    expectedDeliveryAt: order.expectedDeliveryAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod,
    upiId: order.upiId ?? BUSINESS.upiId,
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

  return NextResponse.json(result);
}
