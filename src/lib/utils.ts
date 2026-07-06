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

/** Flat shipping charge when minimum order is met; free at ₹3000+ subtotal. */
export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0 || !meetsMinOrder(subtotal)) return 0;
  if (subtotal >= BUSINESS.freeShippingMinAmount) return 0;
  return BUSINESS.shippingCost;
}

/** Whether subtotal qualifies for free shipping (min order must also be met). */
export function qualifiesForFreeShipping(subtotal: number): boolean {
  return meetsMinOrder(subtotal) && subtotal >= BUSINESS.freeShippingMinAmount;
}

/** Rupees still needed on subtotal to reach free shipping. */
export function freeShippingShortfall(subtotal: number): number {
  if (!meetsMinOrder(subtotal)) return 0;
  return Math.max(0, BUSINESS.freeShippingMinAmount - subtotal);
}

/** Whether cart subtotal meets the minimum order amount. */
export function meetsMinOrder(subtotal: number): boolean {
  return subtotal >= BUSINESS.minOrderAmount;
}

/** Rupees still needed to reach the minimum order amount. */
export function minOrderShortfall(subtotal: number): number {
  return Math.max(0, BUSINESS.minOrderAmount - subtotal);
}

/** Toast message when the cart is below the minimum order amount. */
export function getMinOrderToastMessage(subtotal: number): string {
  const pending = minOrderShortfall(subtotal);
  return `Minimum order is ${formatPrice(BUSINESS.minOrderAmount)}. Your cart is ${formatPrice(subtotal)} — add ${formatPrice(pending)} more to place your order.`;
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

function normalizeAddressPart(value: string): string {
  return value.trim().toLowerCase();
}

/** True when `part` is already present in `text` (avoids "ponneri, ponneri" on invoices). */
function addressPartIncluded(text: string, part: string): boolean {
  const normalizedText = normalizeAddressPart(text);
  const normalizedPart = normalizeAddressPart(part);
  if (!normalizedPart) return true;
  return (
    normalizedText === normalizedPart ||
    normalizedText.endsWith(normalizedPart) ||
    normalizedText.endsWith(`, ${normalizedPart}`) ||
    normalizedText.includes(`${normalizedPart},`)
  );
}

/** Bill-to address lines for invoices — street/area first, then city/state/pincode without duplicates. */
export function formatInvoiceAddressLines(customer: {
  address: string;
  city: string;
  state: string;
  pincode: string;
}): string[] {
  const street = customer.address.trim();
  const city = customer.city.trim();
  const state = customer.state.trim();
  const pincode = customer.pincode.trim();

  const locationParts: string[] = [];
  if (city && !addressPartIncluded(street, city)) locationParts.push(city);
  if (state) locationParts.push(state);
  let locationLine = locationParts.join(", ");
  if (pincode) {
    locationLine = locationLine ? `${locationLine} - ${pincode}` : pincode;
  }

  if (!street) return locationLine ? [locationLine] : [];
  if (!locationLine) return [street];
  if (addressPartIncluded(street, city) && street.includes(state) && street.includes(pincode)) {
    return [street];
  }
  return [street, locationLine];
}

/** Single-line delivery address for WhatsApp and summaries. */
export function formatFullDeliveryAddress(customer: {
  address: string;
  city: string;
  state: string;
  pincode: string;
}): string {
  return formatInvoiceAddressLines(customer).join(", ");
}
