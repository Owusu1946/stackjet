import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const siteUrl = "https://www.expojet.dev";

// Build time, not request time. Using `new Date()` here made every entry's `lastModified`
// change on every rebuild, so crawlers saw the whole site as freshly modified.
const buildDate = new Date();

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
    lastModified: buildDate,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/docs" ? 0.9 : 0.7,
  }));
}
