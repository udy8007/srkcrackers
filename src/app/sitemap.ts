import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/constants";
import { listActiveSeoProducts, productSeoUrl } from "@/lib/seo-products";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: BUSINESS.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BUSINESS.url}/1000-wala`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  try {
    const products = await listActiveSeoProducts();
    for (const product of products) {
      entries.push({
        url: productSeoUrl(product.slug),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: product.slug.includes("1000-wala") ? 0.9 : 0.8,
      });
    }
  } catch (error) {
    console.error("[sitemap] Failed to load products:", error);
  }

  return entries;
}
