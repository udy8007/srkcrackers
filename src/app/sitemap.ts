import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: BUSINESS.url,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
