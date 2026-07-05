import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

/** Statuses where the parcel is with postal — manual updates are locked. */
export const POSTAL_HANDOVER_STATUSES: OrderStatus[] = ["DISPATCHED"];

/** Whether admin can still edit payment screenshot or change status manually. */
export function canAdminEditBeforeDispatch(status: OrderStatus): boolean {
  return status !== "DISPATCHED" && status !== "DELIVERED" && status !== "CANCELLED";
}

/** Mark DISPATCHED orders as DELIVERED when expected delivery time has passed. */
export async function autoDeliverDueOrders(): Promise<number> {
  const now = new Date();
  const due = await prisma.order.findMany({
    where: {
      status: "DISPATCHED",
      expectedDeliveryAt: { lte: now },
    },
    select: { id: true },
  });

  if (due.length === 0) return 0;

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

  return due.length;
}
