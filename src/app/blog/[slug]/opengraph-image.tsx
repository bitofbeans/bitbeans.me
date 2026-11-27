import { ogContentType, ogSize, renderOgCard } from "~/components/og-card";
import { getBlogPostBySlug, getBlogPosts } from "~/lib/blog";
import { blogPostPath, siteTitle } from "~/lib/sections";

export const dynamicParams = false;
export const size = ogSize;
export const contentType = ogContentType;
export const alt = `${siteTitle} — BitBeans`;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return renderOgCard({});
  }
  return renderOgCard({
    heading: post.title,
    badge: `bitbeans.me${blogPostPath(post.slug)}`,
    subtitle: post.summary || post.displayDate,
  });
}
