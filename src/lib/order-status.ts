import type { OrderStatus } from "@prisma/client";

/** Statuses where the parcel is with postal — manual updates are locked. */
export const POSTAL_HANDOVER_STATUSES: OrderStatus[] = ["DISPATCHED"];

/** Whether admin can still edit payment screenshot or change status manually. */
export function canAdminEditBeforeDispatch(status: OrderStatus): boolean {
  return status !== "DISPATCHED" && status !== "DELIVERED" && status !== "CANCELLED";
}
