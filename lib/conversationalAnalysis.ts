/** Helpers for rendering long, friendly AI analysis in the UI. */

const LONG_CONTENT_CHARS = 1_100;
const QUICK_TAKE_MAX_CHARS = 340;
const MIN_QUICK_TAKE_CHARS = 48;

export function isLongConversationalContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length >= LONG_CONTENT_CHARS) return true;
  const headingCount = trimmed.match(/^#{2,3}\s+/gm)?.length ?? 0;
  return headingCount >= 2;
}

export function stripMarkdownInline(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function truncateToSentences(text: string, maxSentences: number): string {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!matches?.length) return text;
  return matches.slice(0, maxSentences).join("").trim();
}

/** First readable paragraph — used for the pinned "Quick take" card. */
export function extractQuickTake(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const bottomLine = trimmed.match(
    /(?:^|\n)(?:#{1,3}\s*)?(?:\*\*)?(?:bottom line|one clear recommendation|my recommendation|i(?:'d| would))\b[^:\n]*:?\s*([^\n]+)/im,
  );
  if (bottomLine?.[1]) {
    const candidate = stripMarkdownInline(bottomLine[1]);
    if (candidate.length >= MIN_QUICK_TAKE_CHARS) {
      return candidate.length > QUICK_TAKE_MAX_CHARS
        ? `${candidate.slice(0, QUICK_TAKE_MAX_CHARS).trim()}…`
        : candidate;
    }
  }

  const blocks = trimmed.split(/\n{2,}/);
  for (const block of blocks) {
    const line = block.trim();
    if (!line || /^#{1,6}\s/.test(line) || /^[-*]\s/.test(line)) continue;
    const plain = stripMarkdownInline(line.replace(/\n/g, " "));
    if (plain.length < MIN_QUICK_TAKE_CHARS) continue;
    const clipped = truncateToSentences(plain, 3);
    if (clipped.length > QUICK_TAKE_MAX_CHARS) {
      return `${clipped.slice(0, QUICK_TAKE_MAX_CHARS).trim()}…`;
    }
    return clipped;
  }

  return null;
}

export type MarkdownSection = {
  id: string;
  title: string;
  body: string;
};

export function splitMarkdownSections(content: string): {
  preamble: string;
  sections: MarkdownSection[];
} {
  const lines = content.split("\n");
  const preambleLines: string[] = [];
  const sections: MarkdownSection[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(.+)$/);
    if (match) {
      if (current) {
        sections.push({
          id: slugify(current.title),
          title: current.title,
          body: current.bodyLines.join("\n").trim(),
        });
      }
      current = { title: match[1].trim(), bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
    else preambleLines.push(line);
  }

  if (current) {
    sections.push({
      id: slugify(current.title),
      title: current.title,
      body: current.bodyLines.join("\n").trim(),
    });
  }

  return {
    preamble: preambleLines.join("\n").trim(),
    sections,
  };
}

/** Drop the opening paragraph from the body when it duplicates the quick-take card. */
export function bodyWithoutQuickTakeDuplicate(
  body: string,
  quickTake: string | null,
): string {
  if (!quickTake || !body.trim()) return body;

  const blocks = body.trim().split(/\n{2,}/);
  if (blocks.length === 0) return body;

  const firstPlain = stripMarkdownInline(blocks[0].replace(/\n/g, " "));
  const takePlain = stripMarkdownInline(quickTake.replace(/…$/, ""));
  const prefixLen = Math.min(72, takePlain.length, firstPlain.length);
  if (
    prefixLen >= 32 &&
    (firstPlain.startsWith(takePlain.slice(0, prefixLen)) ||
      takePlain.startsWith(firstPlain.slice(0, prefixLen)))
  ) {
    return blocks.slice(1).join("\n\n").trim();
  }

  return body;
}

export const MONEY_HIGHLIGHT_PATTERN = /\$[\d,]+(?:\.\d+)?/g;
