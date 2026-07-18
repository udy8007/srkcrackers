import type { OrderStatus } from "@/lib/db/types";

/** Product shape returned to the storefront. */
export interface ProductDTO {
  id: string;
  name: string;
  nameTa: string | null;
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
  upiReferenceNumber?: string;
  paymentScreenshot?: string;
  paymentMethod?: string;
  draftOrderId?: string;
}

/** Payload sent to POST /api/orders/draft (incomplete checkout). */
export interface CheckoutDraftInput {
  customer: CustomerInput;
  items: CartLineInput[];
  draftOrderId?: string;
  paymentMethod?: string;
  checkoutStep?: "PAYMENT" | "REFERENCE";
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

/** Customer details shown on invoices. */
export interface InvoiceCustomer {
  name: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string | null;
}

/** Data required to generate an order invoice PDF. */
export interface InvoiceData {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  statusLabel: string;
  customer: InvoiceCustomer;
  items: Pick<OrderItemDTO, "name" | "pack" | "price" | "qty" | "amount">[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod?: string;
  upiId?: string;
}

/** Public tracking result (no sensitive data). */
export interface TrackOrderResult {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  total: number;
  subtotal: number;
  shipping: number;
  expectedDeliveryAt: string | null;
  createdAt: string;
  paymentMethod: string;
  upiId: string;
  customer: InvoiceCustomer;
  items: OrderItemDTO[];
  statusHistory: StatusHistoryDTO[];
}
