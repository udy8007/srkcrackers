import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { BUSINESS } from "@/lib/constants";

const RAZORPAY_API = "https://api.razorpay.com/v1";

export type RazorpayOrderStatus = "created" | "attempted" | "paid";

export interface RazorpayApiOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: RazorpayOrderStatus;
  notes?: Record<string, string>;
}

export interface RazorpayApiPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method?: string;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
}

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || "";
}

export function getRazorpayWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
}

export function paymentLog(
  event: string,
  extra: Record<string, unknown> = {},
): void {
  console.info(
    JSON.stringify({
      scope: "razorpay",
      event,
      ts: new Date().toISOString(),
      ...extra,
    }),
  );
}

function basicAuthHeader(): string {
  return `Basic ${Buffer.from(`${getRazorpayKeyId()}:${getRazorpayKeySecret()}`).toString("base64")}`;
}

async function razorpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const message =
      typeof json === "object" && json && "error" in json
        ? JSON.stringify((json as { error: unknown }).error)
        : text.slice(0, 400);
    paymentLog("api_error", { path, status: response.status, message });
    throw new Error(`Razorpay API ${response.status}: ${message}`);
  }
  return json as T;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayApiOrder> {
  return razorpayFetch<RazorpayApiOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      payment_capture: 1,
      notes: input.notes,
    }),
  });
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayApiOrder> {
  return razorpayFetch<RazorpayApiOrder>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function fetchRazorpayOrderPayments(orderId: string): Promise<RazorpayApiPayment[]> {
  const result = await razorpayFetch<{ items?: RazorpayApiPayment[] }>(
    `/orders/${encodeURIComponent(orderId)}/payments`,
  );
  return result.items ?? [];
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayApiPayment> {
  return razorpayFetch<RazorpayApiPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = getRazorpayKeySecret();
  if (!secret || !input.razorpaySignature) return false;
  const expected = createHmac("sha256", secret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(input.razorpaySignature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = getRazorpayWebhookSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees) * 100;
}

export function checkoutPrefill(order: {
  customerName: string;
  email: string | null;
  phone: string;
}) {
  const digits = order.phone.replace(/\D/g, "");
  const contact =
    digits.length === 10
      ? `+91${digits}`
      : digits.length === 12 && digits.startsWith("91")
        ? `+${digits}`
        : order.phone;
  const email = order.email?.trim() || undefined;
  return {
    name: order.customerName,
    email,
    contact,
    method: "upi" as const,
  };
}

export function checkoutBrand() {
  return {
    name: BUSINESS.name,
    description: "Festival crackers order",
    theme: { color: "#730a12" },
  };
}
