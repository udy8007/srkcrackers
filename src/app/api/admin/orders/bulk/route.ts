import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/constants";
import { dispatchNotification, notifyStatusChange } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const VALID = new Set(ORDER_STATUSES.map((s) => s.key));

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { ids, status, note } = body;
  if (!ids?.length || !status || !VALID.has(status as OrderStatus)) {
    return NextResponse.json({ error: "ids and valid status required" }, { status: 400 });
  }

  const orderStatus = status as OrderStatus;
  if (orderStatus === "DELIVERED") {
    return NextResponse.json(
      { error: "Delivered is set automatically after expected delivery time" },
      { status: 400 },
    );
  }
  if (orderStatus === "DISPATCHED") {
    return NextResponse.json(
      { error: "Use order detail page to dispatch with expected delivery time" },
      { status: 400 },
    );
  }

  const label = ORDER_STATUS_LABEL[orderStatus];
  const trimmedNote = note?.trim() || null;

  let count = 0;
  for (const id of ids) {
    try {
      const existing = await prisma.order.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!existing) continue;

      await prisma.order.update({
        where: { id },
        data: {
          status: orderStatus,
          statusHistory: {
            create: { status: orderStatus, label, note: trimmedNote },
          },
        },
      });
      dispatchNotification(() => notifyStatusChange(id, existing.status, trimmedNote));
      count++;
    } catch {
      /* skip missing */
    }
  }

  return NextResponse.json({ count });
}
