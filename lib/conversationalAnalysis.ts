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

/** Remove common report-style lead labels the model sometimes adds anyway. */
export function stripLeadResponseLabels(content: string): string {
  let result = content.trimStart();
  const labelPattern =
    /^(?:\*\*)?(?:Short answer|In short|Summary|Bottom line|My recommendation)(?:\*\*)?:\s*/i;

  while (labelPattern.test(result)) {
    result = result.replace(labelPattern, "").trimStart();
  }

  return result;
}

/** Remove "(plain English)" meta labels the model sometimes echoes from prompts. */
export function stripPlainEnglishLabels(content: string): string {
  return content
    .replace(/\s*\(plain English\)/gi, "")
    .replace(/\bin plain English\b(?=\s*[—:\-])/gi, "")
    .replace(/ {2,}/g, " ");
}

/** Strip playbook meta scaffolding like "(what)" / "(why ...)" from model output. */
export function stripPlaybookMetaLabels(content: string): string {
  return content
    .replace(/\s*\(what\s*(?:→|->)\s*why[^)]*\)/gi, "")
    .replace(/\s*\(what\)/gi, "")
    .replace(/\s*\(why[^)]*\)/gi, "")
    .replace(/\s*\(gap[^)]*\)/gi, "")
    .replace(/ {2,}/g, " ");
}

/** Remove data-source callouts the model sometimes echoes in playbook replies. */
export function stripPlaybookSourceLabels(content: string): string {
  return content
    .replace(
      /(?:yfinance\/SEC metrics|SEC filing metrics|Filings|Per filings)\s+show/gi,
      "The numbers show",
    )
    .replace(/\b(?:yfinance\/SEC|SEC\/yfinance)\b/gi, "")
    .replace(/\bper filings\b/gi, "")
    .replace(/\bfrom (?:SEC |EDGAR )?filings?\b/gi, "")
    .replace(/\bin our dataset\b/gi, "")
    .replace(/\bnot (?:provided|available) in (?:our )?dataset\b/gi, "isn't clear")
    .replace(/ {2,}/g, " ")
    .replace(/\bin the materials you provided\b/gi, "")
    .replace(/\bmaterials you provided\b/gi, "")
    .replace(/\bmaterials you gave\b/gi, "")
    .replace(
      /\bI don't have (?:the exact current|a precise current) payout ratio[^.]*\.\s*/gi,
      "",
    )
    .replace(
      /\bso I can't quantify payout ratio or the exact FCF[-‑]to[-‑]dividend coverage[^.]*\.\s*/gi,
      "",
    )
    .replace(
      /\bso dividend coverage beyond headline FCF isn't fully quantified here\.?\s*/gi,
      "",
    )
    .replace(/\bGood question\b[^.]*\.\s*/gi, "")
    .replace(/\bData I need\b[\s\S]*?(?=\n\n|\*\*Verdict:\*\*|$)/gi, "")
    .replace(/\bExact formulas I['’]ll use\b[\s\S]*?(?=\n\n|\*\*Verdict:\*\*|$)/gi, "")
    .replace(/\bmaterials you pasted\b/gi, "")
    .replace(/\bWant me to fetch\b[^.]*\.\s*/gi, "")
    .replace(/\bisn't fully quantified here\.?\s*/gi, "")
    .replace(/\s+([,.])/g, "$1");
}
