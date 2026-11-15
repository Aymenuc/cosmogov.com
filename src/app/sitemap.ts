import type { MetadataRoute } from "next";

const SITE = "https://www.cosmogov.com";

// Public pages only. The signed-in workspace is kept out of search engines.
const pages = [
  "",
  "/about",
  "/missions/demo",
  "/trust",
  "/government",
  "/accessibility",
  "/docs",
  "/blog",
  "/changelog",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({
    url: `${SITE}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
