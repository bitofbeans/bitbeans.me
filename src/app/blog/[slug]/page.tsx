import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioScene } from "~/components/portfolio-scene";
import { getBlogPostBySlug, getBlogPosts } from "~/lib/blog";
import {
  blogPostPath,
  blogPostTitle,
  sectionMeta,
  siteTitle,
} from "~/lib/sections";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  const description = post.summary || sectionMeta.Blog.description;
  const fullTitle = blogPostTitle(post.title);
  const path = blogPostPath(post.slug);
  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      siteName: siteTitle,
      title: fullTitle,
      description,
      url: path,
      publishedTime: post.date || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blogPosts = await getBlogPosts();
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) notFound();
  return (
    <PortfolioScene
      initialSection="Blog"
      initialPostSlug={post.slug}
      blogPosts={blogPosts}
    />
  );
}
