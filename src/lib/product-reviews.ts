import { prisma } from "@/lib/prisma";
import type { ProductReviewDTO, ProductReviewSummary, ProductReviewsResponse } from "@/types";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export function clampReviewText(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, 800);
}

export function isValidRating(rating: unknown): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

function emptyDistribution(): ProductReviewSummary["distribution"] {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function serializeReview(review: {
  id: string;
  rating: number;
  text: string;
  reviewerName: string;
  createdAt: Date;
}): ProductReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    text: review.text,
    reviewerName: review.reviewerName,
    createdAt: review.createdAt.toISOString(),
    verifiedPurchase: true,
  };
}

export async function getProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const [reviews, aggregates] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId, visible: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        text: true,
        reviewerName: true,
        createdAt: true,
      },
    }),
    prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId, visible: true },
      _count: { _all: true },
    }),
  ]);

  const distribution = emptyDistribution();
  let total = 0;
  let count = 0;
  for (const row of aggregates) {
    const rating = row.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = row._count._all;
      total += rating * row._count._all;
      count += row._count._all;
    }
  }

  const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

  return {
    summary: { average, count, distribution },
    reviews: reviews.map(serializeReview),
  };
}
