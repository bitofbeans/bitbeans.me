export const sections = ["Work", "About", "Game"] as const;
export type Section = (typeof sections)[number];

export function sectionPath(section: Section) {
  return "/" + section.toLowerCase();
}
