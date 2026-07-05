/** Format a whole-rupee number as an INR currency string. */
import { BUSINESS } from "@/lib/constants";

export function formatPrice(value: number): string {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

/** Merge conditional class names (tiny clsx replacement). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Generate a human-readable order number: SRK-YYYYMMDD-XXXX. */
export function generateOrderNumber(): string {
  const now = new Date();
  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SRK-${date}-${rand}`;
}

/** Validate a 10-digit Indian mobile number. */
export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim());
}

/** Validate a 6-digit Indian pincode. */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

/** Shipping charge for orders below the free-delivery threshold. */
export function calculateShipping(subtotal: number): number {
  return subtotal >= BUSINESS.freeDeliveryMin ? 0 : BUSINESS.shippingCost;
}

/** Order totals with shipping applied. */
export function calculateOrderTotals(subtotal: number) {
  const shipping = calculateShipping(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

/** Shipping stored on a saved order (total minus item subtotal). */
export function getStoredShipping(subtotal: number, total: number): number {
  return Math.max(0, total - subtotal);
}

/** Discount percentage from mrp -> sale price. */
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/** Format an ISO/date value for display in IST. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
