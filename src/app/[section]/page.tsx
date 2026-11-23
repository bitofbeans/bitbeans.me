import { notFound } from "next/navigation";
import { PortfolioScene } from "../portfolio-scene";
import { sections } from "../sections";

export const dynamicParams = false;

export function generateStaticParams() {
  return sections.map((section) => ({ section: section.toLowerCase() }));
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = sections.find((entry) => entry.toLowerCase() === slug);
  if (!section) notFound();
  return <PortfolioScene initialSection={section} />;
}
