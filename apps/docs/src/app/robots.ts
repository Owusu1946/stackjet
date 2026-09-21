import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://docs.expojet.com/sitemap.xml",
    host: "https://docs.expojet.com",
  };
}
