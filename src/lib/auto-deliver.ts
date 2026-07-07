import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

/** Mark DISPATCHED orders as DELIVERED when expected delivery time has passed. */
export async function autoDeliverDueOrders(): Promise<string[]> {
  const now = new Date();
  const due = await prisma.order.findMany({
    where: {
      status: "DISPATCHED",
      expectedDeliveryAt: { lte: now },
    },
    select: { id: true },
  });

  if (due.length === 0) return [];

  await prisma.$transaction(
    due.map((order) =>
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "DELIVERED",
          statusHistory: {
            create: {
              status: "DELIVERED",
              label: ORDER_STATUS_LABEL.DELIVERED,
              note: "Auto-marked delivered — expected delivery time reached (postal handover)",
            },
          },
        },
      }),
    ),
  );

  return due.map((o) => o.id);
}
