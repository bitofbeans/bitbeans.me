import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioScene } from "../portfolio-scene";
import {
  sectionFromPath,
  sectionMeta,
  sectionPath,
  sections,
} from "../sections";

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
  const path = sectionPath(section);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
    },
    twitter: {
      title,
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
  return <PortfolioScene initialSection={section} />;
}
