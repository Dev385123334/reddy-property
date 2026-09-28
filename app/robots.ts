import type { MetadataRoute } from "next";
import { siteBase, trimTrailingSlash } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = trimTrailingSlash(siteBase().url);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/booking/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}