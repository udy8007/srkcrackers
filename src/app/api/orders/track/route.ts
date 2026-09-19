import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, BUSINESS } from "@/lib/constants";
import { isValidPhone } from "@/lib/utils";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";
import { notifyAutoDelivered } from "@/lib/notifications";
import { canCustomerRepay } from "@/lib/order-status";
import { dispatchSchedulerTick } from "@/lib/scheduler";
import type { PaymentStatus } from "@/lib/db/types";
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

  const status = order.status as OrderStatus;

  const result: TrackOrderResult = {
    orderNumber: order.orderNumber,
    status,
    statusLabel: ORDER_STATUS_LABEL[status],
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
    items: (order.items ?? []).map(
      (item: { id: string; name: string; pack: string; price: number; qty: number; amount: number }) => ({
        id: item.id,
        name: item.name,
        pack: item.pack,
        price: item.price,
        qty: item.qty,
        amount: item.amount,
      }),
    ),
    statusHistory: (order.statusHistory ?? []).map(
      (entry: { status: OrderStatus; label: string; note: string | null; createdAt: Date }) => ({
        status: entry.status,
        label: entry.label,
        note: entry.note,
        createdAt: entry.createdAt.toISOString(),
      }),
    ),
    cancelRequestedAt: order.cancelRequestedAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    cancelStatus: order.cancelStatus ?? null,
    cancelDecidedAt: order.cancelDecidedAt?.toISOString() ?? null,
    cancelAdminNote: order.cancelAdminNote,
    paymentStatus: order.paymentStatus as PaymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABEL[order.paymentStatus as PaymentStatus],
    canRepay: canCustomerRepay(status, order.paymentStatus as PaymentStatus),
    paidAt: order.paidAt?.toISOString() ?? null,
  };

  return NextResponse.json(result);
}
