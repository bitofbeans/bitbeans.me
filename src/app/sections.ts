export const siteUrl = "https://bitbeans.me";
export const siteTitle = "Benas Unguraitis";
export const siteDescription =
  "Personal website of Benas Unguraitis (BitBeans) — games, designs, and music.";

export const sections = ["Work", "About", "Game"] as const;
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
  Game: {
    title: "Game",
    description: "Circuit Snake — a mini game on bitbeans.me.",
  },
};

export function sectionPath(section: Section) {
  return "/" + section.toLowerCase();
}

export function sectionFromPath(pathname: string): Section | null {
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
