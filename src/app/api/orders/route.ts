import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { generateOrderNumber, isValidPhone, isValidPincode } from "@/lib/utils";
import type { CreateOrderInput } from "@/types";

export const dynamic = "force-dynamic";

const MAX_SCREENSHOT_CHARS = 3_000_000; // ~2MB base64 guard

export async function POST(request: NextRequest) {
  let body: CreateOrderInput;
  try {
    body = (await request.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { customer, items, paymentScreenshot, paymentMethod } = body ?? {};

  // ── Validate customer ──────────────────────────────────────
  if (!customer?.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isValidPhone(customer.phone ?? "")) {
    return NextResponse.json({ error: "Valid 10-digit mobile number is required" }, { status: 400 });
  }
  if (!customer.address?.trim() || !customer.city?.trim() || !customer.state?.trim()) {
    return NextResponse.json({ error: "Full delivery address is required" }, { status: 400 });
  }
  if (!isValidPincode(customer.pincode ?? "")) {
    return NextResponse.json({ error: "Valid 6-digit pincode is required" }, { status: 400 });
  }

  // ── Validate items ─────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }
  const qtyByProduct = new Map<string, number>();
  for (const item of items) {
    const qty = Math.floor(Number(item?.qty));
    if (!item?.productId || !Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
    }
    qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + qty);
  }

  if (paymentScreenshot && paymentScreenshot.length > MAX_SCREENSHOT_CHARS) {
    return NextResponse.json({ error: "Payment screenshot is too large" }, { status: 400 });
  }

  // ── Price from DB (authoritative) ──────────────────────────
  const products = await prisma.product.findMany({
    where: { id: { in: [...qtyByProduct.keys()], }, active: true },
  });
  if (products.length !== qtyByProduct.size) {
    return NextResponse.json({ error: "Some products are no longer available" }, { status: 400 });
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
  const total = subtotal;

  const hasPayment = Boolean(paymentScreenshot);
  const status: OrderStatus = hasPayment ? "VERIFYING" : "PLACED";
  const now = new Date();
  const history: { status: OrderStatus; label: string; createdAt: Date }[] = [
    { status: "PLACED", label: ORDER_STATUS_LABEL.PLACED, createdAt: now },
  ];
  if (hasPayment) {
    history.push({ status: "PAYMENT_UPLOADED", label: ORDER_STATUS_LABEL.PAYMENT_UPLOADED, createdAt: now });
    history.push({ status: "VERIFYING", label: ORDER_STATUS_LABEL.VERIFYING, createdAt: now });
  }

  // ── Create (retry on rare orderNumber collision) ───────────
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerName: customer.name.trim(),
          phone: customer.phone.trim(),
          altPhone: customer.altPhone?.trim() || null,
          email: customer.email?.trim() || null,
          address: customer.address.trim(),
          city: customer.city.trim(),
          state: customer.state.trim(),
          pincode: customer.pincode.trim(),
          notes: customer.notes?.trim() || null,
          paymentMethod: paymentMethod?.trim() || "UPI",
          upiId: BUSINESS.upiId,
          paymentScreenshot: paymentScreenshot || null,
          subtotal,
          total,
          status,
          items: { create: orderItems },
          statusHistory: { create: history },
        },
        select: { orderNumber: true, total: true, status: true, createdAt: true },
      });

      return NextResponse.json(
        {
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        },
        { status: 201 },
      );
    } catch (error) {
      const isUniqueViolation =
        (error as Prisma.PrismaClientKnownRequestError)?.code === "P2002";
      if (isUniqueViolation) continue;
      console.error("POST /api/orders failed:", error);
      return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate a unique order number" }, { status: 500 });
}
