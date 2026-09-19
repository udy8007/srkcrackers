import type { MetadataRoute } from "next";
import { resolveSiteOrigin } from "@/lib/site-url";
import { listActiveSeoProducts, productSeoPath } from "@/lib/seo-products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await resolveSiteOrigin();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/1000-wala`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  try {
    const products = await listActiveSeoProducts();
    for (const product of products) {
      if (!product.slug) continue;
      entries.push({
        url: `${origin}${productSeoPath(product.slug)}`,
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
