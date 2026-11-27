import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BlogBlock, BlogPost, InlineToken } from "./blog-types";

const blogDir = join(process.cwd(), "content/blog");

function isSafeHref(href: string) {
  return (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:") ||
    href.startsWith("/")
  );
}

function parseInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", text: input.slice(cursor, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("`")) {
      tokens.push({ type: "code", text: raw.slice(1, -1) });
    } else if (raw.startsWith("**")) {
      tokens.push({ type: "bold", text: raw.slice(2, -2) });
    } else if (raw.startsWith("*")) {
      tokens.push({ type: "italic", text: raw.slice(1, -1) });
    } else if (raw.startsWith("[")) {
      const split = raw.indexOf("](");
      const label = raw.slice(1, split);
      const href = raw.slice(split + 2, -1).trim();
      if (isSafeHref(href)) {
        tokens.push({ type: "link", text: label, href });
      } else {
        tokens.push({ type: "text", text: label });
      }
    }
    cursor = match.index + raw.length;
  }

  if (cursor < input.length) {
    tokens.push({ type: "text", text: input.slice(cursor) });
  }
  return tokens;
}

function parseMarkdown(markdown: string): BlogBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: BlogBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level: 2 | 3 = headingMatch[1]!.length <= 2 ? 2 : 3;
      blocks.push({
        type: "heading",
        level,
        tokens: parseInline(headingMatch[2]!.trim()),
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        quoteLines.push(lines[i]!.trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        tokens: parseInline(quoteLines.join(" ")),
      });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!.trim())) {
        items.push(parseInline(lines[i]!.trim().replace(/^[-*]\s+/, "")));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: InlineToken[][] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!.trim())) {
        items.push(parseInline(lines[i]!.trim().replace(/^\d+\.\s+/, "")));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph (join contiguous plain lines)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i]!.trim();
      if (
        !current ||
        current.startsWith("```") ||
        current.startsWith(">") ||
        /^#{1,3}\s+/.test(current) ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(current)
      ) {
        break;
      }
      paraLines.push(current);
      i++;
    }
    blocks.push({
      type: "paragraph",
      tokens: parseInline(paraLines.join(" ")),
    });
  }

  return blocks;
}

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { meta: {}, body: normalized };
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    return { meta: {}, body: normalized };
  }
  const header = normalized.slice(4, end);
  const body = normalized.slice(end + 4).replace(/^\n+/, "");
  const meta: Record<string, string> = {};
  for (const line of header.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) meta[key] = value;
  }
  return { meta, body };
}

function formatDisplayDate(date: string) {
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(date);
  if (iso) {
    return iso[3]
      ? `${iso[1]} · ${iso[2]} · ${iso[3]}`
      : `${iso[1]} · ${iso[2]}`;
  }
  return date;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugToTitle(slug: string) {
  return slug
    .replace(/^\d+-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  let entries: string[];
  try {
    entries = await readdir(blogDir);
  } catch {
    return [];
  }

  const mdFiles = entries.filter((name) => name.endsWith(".md")).sort();
  const usedSlugs = new Set<string>();
  const posts = await Promise.all(
    mdFiles.map(async (filename): Promise<BlogPost> => {
      const baseName = filename.replace(/\.md$/, "");
      const raw = await readFile(join(blogDir, filename), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const blocks = parseMarkdown(body);
      const date = meta.date ?? "";
      const firstParagraph = blocks.find((b) => b.type === "paragraph");
      const fallbackSummary = firstParagraph
        ? firstParagraph.tokens.map((t) => t.text).join("")
        : "";
      const rawSlug =
        meta.slug && meta.slug.length > 0 ? meta.slug : baseName;
      const baseSlug = slugify(rawSlug) || "post";
      return {
        slug: baseSlug,
        title:
          meta.title && meta.title.length > 0
            ? meta.title
            : slugToTitle(baseSlug),
        date,
        displayDate: formatDisplayDate(date),
        summary:
          meta.summary && meta.summary.length > 0
            ? meta.summary
            : fallbackSummary,
        blocks,
      };
    }),
  );

  // Deduplicate slugs deterministically if multiple files normalize to the same slug.
  for (const post of posts) {
    let candidate = post.slug;
    let suffix = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${post.slug}-${suffix++}`;
    }
    post.slug = candidate;
    usedSlugs.add(candidate);
  }

  // Sort newest first by ISO date, then by slug for deterministic order.
  return posts.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    return dateCompare !== 0 ? dateCompare : a.slug.localeCompare(b.slug);
  });
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
