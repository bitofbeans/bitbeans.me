import type { MetadataRoute } from "next";
import { sectionPath, sections, siteUrl } from "./sections";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", ...sections.map(sectionPath)].map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
