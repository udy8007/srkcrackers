import { isValidPhone, isValidPincode } from "@/lib/utils";
import type { CustomerInput } from "@/types";

const CUSTOMER_KEY = "srk_checkout_customer";

export function isCustomerComplete(customer: CustomerInput): boolean {
  return (
    Boolean(customer.name.trim()) &&
    isValidPhone(customer.phone) &&
    Boolean(customer.address.trim()) &&
    Boolean(customer.city.trim()) &&
    Boolean(customer.state.trim()) &&
    isValidPincode(customer.pincode)
  );
}

export function loadSavedCustomer(): CustomerInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerInput;
    if (!isCustomerComplete(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCustomerDetails(customer: CustomerInput): void {
  if (typeof window === "undefined" || !isCustomerComplete(customer)) return;
  try {
    window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}
