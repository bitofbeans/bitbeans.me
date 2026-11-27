import type { MetadataRoute } from "next";
import { getBlogPosts } from "~/lib/blog";
import { blogPostPath, sectionPath, sections, siteUrl } from "~/lib/sections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  return [
    "/",
    ...sections.map(sectionPath),
    ...posts.map((post) => blogPostPath(post.slug)),
  ].map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
