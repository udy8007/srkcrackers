import type { OrderStatus } from "@prisma/client";

/** Product shape returned to the storefront. */
export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  pack: string;
  price: number;
  mrp: number;
  imageUrl: string;
  description: string;
  categoryKey: string;
}

/** A category with its products, used to render the accordion. */
export interface CategoryWithProductsDTO {
  key: string;
  label: string;
  products: ProductDTO[];
}

/** A single line item submitted with an order. */
export interface CartLineInput {
  productId: string;
  qty: number;
}

/** Customer details captured in the checkout form. */
export interface CustomerInput {
  name: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

/** Payload sent to POST /api/orders. */
export interface CreateOrderInput {
  customer: CustomerInput;
  items: CartLineInput[];
  paymentScreenshot?: string;
}

/** Status history entry for the tracking timeline. */
export interface StatusHistoryDTO {
  status: OrderStatus;
  label: string;
  note?: string | null;
  createdAt: string;
}

/** Order item snapshot. */
export interface OrderItemDTO {
  id: string;
  name: string;
  pack: string;
  price: number;
  qty: number;
  amount: number;
}

/** Public tracking result (no sensitive data). */
export interface TrackOrderResult {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  total: number;
  createdAt: string;
  items: OrderItemDTO[];
  statusHistory: StatusHistoryDTO[];
}
