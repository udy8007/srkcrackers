import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPhone } from "@/lib/utils";
import {
  clampReviewText,
  getProductReviews,
  isValidRating,
  normalizePhone,
  serializeReview,
} from "@/lib/product-reviews";
import type { CreateProductReviewInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, active: true },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const payload = await getProductReviews(product.id);
  return NextResponse.json(payload);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;

  let body: CreateProductReviewInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim().toUpperCase() ?? "";
  const phone = normalizePhone(body.phone ?? "");
  const rating = body.rating;
  const text = clampReviewText(body.text ?? "");
  const reviewerName = (body.reviewerName ?? "").trim().slice(0, 80);

  if (!orderNumber || !isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Enter a valid Order ID and 10-digit mobile number" },
      { status: 400 },
    );
  }
  if (!isValidRating(rating)) {
    return NextResponse.json({ error: "Choose a rating from 1 to 5 stars" }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json(
      { error: "Please write at least 10 characters in your review" },
      { status: 400 },
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    select: { id: true, name: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      phone,
      status: "DELIVERED",
    },
    include: {
      items: {
        where: { productId },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      {
        error:
          "No delivered order found for this Order ID and mobile number. Reviews are only available after delivery.",
      },
      { status: 404 },
    );
  }

  const orderItem = order.items[0];
  if (!orderItem) {
    return NextResponse.json(
      { error: "This delivered order does not include this product" },
      { status: 400 },
    );
  }

  const existing = await prisma.productReview.findUnique({
    where: { orderItemId: orderItem.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this product for this order" },
      { status: 409 },
    );
  }

  try {
    const review = await prisma.productReview.create({
      data: {
        productId,
        orderId: order.id,
        orderItemId: orderItem.id,
        rating,
        text,
        reviewerName: reviewerName || order.customerName,
        visible: true,
      },
      select: {
        id: true,
        rating: true,
        text: true,
        reviewerName: true,
        createdAt: true,
      },
    });

    const payload = await getProductReviews(productId);
    return NextResponse.json(
      {
        review: serializeReview(review),
        ...payload,
        message: "Thank you! Your review has been published.",
      },
      { status: 201 },
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "You have already reviewed this product for this order" },
        { status: 409 },
      );
    }
    console.error("Create product review failed:", error);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
