import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioScene } from "~/components/portfolio-scene";
import { getBlogPosts } from "~/lib/blog";
import {
  sectionFromPath,
  sectionMeta,
  sectionPath,
  sections,
  sectionTitle,
  siteTitle,
} from "~/lib/sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return sections.map((section) => ({ section: section.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section: slug } = await params;
  const section = sectionFromPath("/" + slug);
  if (!section) return {};
  const { title, description } = sectionMeta[section];
  const fullTitle = sectionTitle(section);
  const path = sectionPath(section);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteTitle,
      title: fullTitle,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = sectionFromPath("/" + slug);
  if (!section) notFound();
  const blogPosts = await getBlogPosts();
  return <PortfolioScene initialSection={section} blogPosts={blogPosts} />;
}
