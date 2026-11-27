import { ogContentType, ogSize, renderOgCard } from "~/components/og-card";
import { siteDescription, siteTitle } from "~/lib/sections";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = `${siteTitle} — BitBeans`;

export default async function OpenGraphImage() {
  return renderOgCard({
    heading: siteTitle,
    badge: "bitbeans.me",
    subtitle: siteDescription,
  });
}
