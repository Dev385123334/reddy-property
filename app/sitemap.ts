import type { MetadataRoute } from "next";
import { getAllProperties } from "@/lib/guesty/listings";
import { siteBase, trimTrailingSlash } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = trimTrailingSlash(siteBase().url);
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/properties`, lastModified, changeFrequency: "daily", priority: 0.9 },
  ];

  const properties = await getAllProperties().catch(() => []);
  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${base}/properties/${property.slug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticPages, ...propertyPages];
}