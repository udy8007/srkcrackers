import type { OrderStatus, PaymentStatus } from "@/lib/db/types";

/** Statuses where the parcel is with postal — manual updates are locked. */
export const POSTAL_HANDOVER_STATUSES: OrderStatus[] = ["DISPATCHED"];

/** Whether admin can still edit payment screenshot or change status manually. */
export function canAdminEditBeforeDispatch(status: OrderStatus): boolean {
  return status !== "DISPATCHED" && status !== "DELIVERED" && status !== "CANCELLED";
}

/**
 * Statuses where the customer may request cancellation: payment is already
 * done (not PAYMENT_PENDING) and the parcel has not been handed to postal yet.
 */
export const CANCELLABLE_BY_CUSTOMER_STATUSES: OrderStatus[] = [
  "PLACED",
  "PAYMENT_UPLOADED",
  "VERIFYING",
  "CONFIRMED",
  "PROCESSING",
];

/** Whether a customer may request cancellation for an order in this status. */
export function canCustomerRequestCancel(status: OrderStatus): boolean {
  return CANCELLABLE_BY_CUSTOMER_STATUSES.includes(status);
}

/** Unpaid / failed Razorpay (or abandoned checkout) can be paid again from the storefront. */
export function canCustomerRepay(status: OrderStatus, paymentStatus: PaymentStatus): boolean {
  if (paymentStatus === "PAID") return false;
  return status === "PAYMENT_PENDING" || status === "PLACED";
}
