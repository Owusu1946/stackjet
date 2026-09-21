import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const siteUrl = "https://docs.expojet.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/builder",
    "/changelog",
    "/docs",
    ...source.getPages().map((page) => page.url),
  ];

  return [...new Set(paths)].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/docs" ? 0.9 : 0.7,
  }));
}
