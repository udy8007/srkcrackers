import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";
import { calculateOrderTotals, isValidPhone, isValidPincode } from "@/lib/utils";
import type { CartLineInput, CustomerInput } from "@/types";

export type BuiltOrderLine = {
  productId: string;
  name: string;
  pack: string;
  price: number;
  qty: number;
  amount: number;
};

export type BuiltOrderTotals = {
  orderItems: BuiltOrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

export function validateCustomer(customer: CustomerInput | undefined): string | null {
  if (!customer?.name?.trim()) return "Name is required";
  if (!isValidPhone(customer.phone ?? "")) return "Valid 10-digit mobile number is required";
  if (!customer.address?.trim() || !customer.city?.trim() || !customer.state?.trim()) {
    return "Full delivery address is required";
  }
  if (!isValidPincode(customer.pincode ?? "")) return "Valid 6-digit pincode is required";
  return null;
}

export async function buildOrderFromItems(items: CartLineInput[]): Promise<
  | { ok: true; data: BuiltOrderTotals }
  | { ok: false; error: string; status: number }
> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty", status: 400 };
  }

  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    const qty = Math.floor(Number(item?.qty));
    if (!item?.productId || !Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: "Invalid cart item", status: 400 };
    }
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + qty);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...qtyByProduct.keys()] }, active: true },
  });
  if (products.length !== qtyByProduct.size) {
    return {
      ok: false,
      error: "Some items in your cart are outdated. Refresh the page and add them again.",
      status: 400,
    };
  }

  const orderItems = products.map((product) => {
    const qty = qtyByProduct.get(product.id)!;
    return {
      productId: product.id,
      name: product.name,
      pack: product.pack,
      price: product.price,
      qty,
      amount: product.price * qty,
    };
  });
  const subtotal = orderItems.reduce((sum, item) => sum + item.amount, 0);
  if (subtotal < BUSINESS.minOrderAmount) {
    return {
      ok: false,
      error: `Minimum order amount is ₹${BUSINESS.minOrderAmount}`,
      status: 400,
    };
  }
  const { shipping, total } = calculateOrderTotals(subtotal);
  return { ok: true, data: { orderItems, subtotal, shipping, total } };
}

export type CustomerOrderFields = {
  customerName: string;
  phone: string;
  altPhone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
};

export function customerOrderFields(customer: CustomerInput): CustomerOrderFields {
  return {
    customerName: customer.name.trim(),
    phone: customer.phone.trim(),
    altPhone: customer.altPhone?.trim() || null,
    email: customer.email?.trim() || null,
    address: customer.address.trim(),
    city: customer.city.trim(),
    state: customer.state.trim(),
    pincode: customer.pincode.trim(),
    notes: customer.notes?.trim() || null,
  };
}
