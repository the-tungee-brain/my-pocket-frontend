/** Helpers for rendering long, friendly AI analysis in the UI. */

const LONG_CONTENT_CHARS = 1_100;

export function isLongConversationalContent(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length >= LONG_CONTENT_CHARS) return true;
  const headingCount = trimmed.match(/^#{2,3}\s+/gm)?.length ?? 0;
  return headingCount >= 2;
}

export type MarkdownSection = {
  id: string;
  title: string;
  body: string;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export const MONEY_HIGHLIGHT_PATTERN = /\$[\d,]+(?:\.\d+)?/g;

/** Strip leading status lines the API sends before the model answer. */
export function stripStreamingStatusPrefix(content: string): string {
  const trimmed = content.trimStart();
  const match = trimmed.match(
    /^(?:Pulling together your holdings|Reviewing your portfolio|Looking up company data)[^\n]*\n\n/i,
  );
  if (!match) return content;
  return trimmed.slice(match[0].length);
}
