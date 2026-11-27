export type InlineToken =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

export type BlogBlock =
  | { type: "heading"; level: 2 | 3; tokens: InlineToken[] }
  | { type: "paragraph"; tokens: InlineToken[] }
  | { type: "blockquote"; tokens: InlineToken[] }
  | { type: "list"; ordered: boolean; items: InlineToken[][] }
  | { type: "code"; lang?: string; code: string }
  | { type: "hr" };

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  displayDate: string;
  summary: string;
  blocks: BlogBlock[];
};
