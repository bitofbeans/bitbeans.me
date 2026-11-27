import { ogContentType, ogSize, renderOgCard } from "~/components/og-card";
import {
  sectionFromPath,
  sectionMeta,
  sectionPath,
  sections,
  siteTitle,
} from "~/lib/sections";

export const dynamicParams = false;
export const size = ogSize;
export const contentType = ogContentType;
export const alt = `${siteTitle} — BitBeans`;

export function generateStaticParams() {
  return sections.map((section) => ({ section: section.toLowerCase() }));
}

export default async function SectionOpenGraphImage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;
  const section = sectionFromPath("/" + slug);
  if (!section) {
    return renderOgCard({});
  }
  const { title, description } = sectionMeta[section];
  return renderOgCard({
    heading: title,
    badge: `bitbeans.me${sectionPath(section)}`,
    subtitle: description,
  });
}
