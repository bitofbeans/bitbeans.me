export const siteUrl = "https://bitbeans.me";
export const siteTitle = "Benas Unguraitis";
export const siteDescription =
  "Personal website of Benas Unguraitis (BitBeans) — games, designs, and music.";

export const sections = ["Work", "About", "Blog"] as const;
export type Section = (typeof sections)[number];

export const sectionMeta: Record<
  Section,
  { title: string; description: string }
> = {
  Work: {
    title: "Work",
    description:
      "Projects, games, graphic design, and music by Benas Unguraitis.",
  },
  About: {
    title: "About",
    description: "About Benas Unguraitis (BitBeans) and how to get in touch.",
  },
  Blog: {
    title: "Blog",
    description: "Notes, devlogs, and posts by Benas Unguraitis.",
  },
};

export function sectionPath(section: Section) {
  return "/" + section.toLowerCase();
}

export function blogPostPath(slug: string) {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function blogSlugFromPath(pathname: string): string | null {
  const match = /^\/blog\/([^/]+)\/?$/.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function sectionFromPath(pathname: string): Section | null {
  if (blogSlugFromPath(pathname) !== null) return "Blog";
  return sections.find((entry) => sectionPath(entry) === pathname) ?? null;
}

export function sectionFromHash(hash: string): Section | null {
  const normalized = hash.toLowerCase();
  return (
    sections.find((entry) => "#" + entry.toLowerCase() === normalized) ?? null
  );
}

export function sectionFromLocation(
  pathname: string,
  hash: string,
): Section | null {
  return (
    sectionFromPath(pathname) ??
    (pathname === "/" ? sectionFromHash(hash) : null)
  );
}

export function sectionTitle(section: Section | null) {
  return section ? `${sectionMeta[section].title} · ${siteTitle}` : siteTitle;
}

export function blogPostTitle(title: string) {
  return `${title} · Blog · ${siteTitle}`;
}

let visitedSection = false;

export function markSectionVisited() {
  visitedSection = true;
}

export function shouldSkipIntro() {
  return (
    visitedSection ||
    sectionFromLocation(location.pathname, location.hash) !== null
  );
}
