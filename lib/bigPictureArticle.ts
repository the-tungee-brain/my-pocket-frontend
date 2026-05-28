import type { StockSummary } from "@/app/hooks/useStockSummary";

export type BigPictureSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
};

const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z"(\[])/;

/** Split prose into article paragraphs (~3–4 sentences each). */
export function splitIntoParagraphs(
  text: string,
  sentencesPerParagraph = 3,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const blocks = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;

  const sentences = trimmed
    .split(SENTENCE_END)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= sentencesPerParagraph) return [trimmed];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(" "));
  }
  return paragraphs;
}

/** Thesis snapshot only — strengths/risks have dedicated sections below. */
export function buildKeyTakeaways(summary: StockSummary): string[] {
  const fromShort = splitIntoParagraphs(summary.short, 1).slice(0, 2);
  const points = [...fromShort];

  if (points.length === 0) {
    const thesisLead = splitIntoParagraphs(summary.investmentThesis, 1)[0];
    if (thesisLead) points.push(thesisLead);
  }

  points.push(`Overall view: ${summary.sentiment}`);

  return points.slice(0, 3);
}

export function buildBigPictureSections(summary: StockSummary): BigPictureSection[] {
  const sections: BigPictureSection[] = [];

  const storyParagraphs = splitIntoParagraphs(summary.long);
  if (storyParagraphs.length > 0) {
    sections.push({
      id: "company-story",
      title: "Company story",
      paragraphs: storyParagraphs,
    });
  }

  const thesisParagraphs = splitIntoParagraphs(summary.investmentThesis, 2);
  if (thesisParagraphs.length > 0) {
    sections.push({
      id: "investment-thesis",
      title: "Investment thesis",
      paragraphs: thesisParagraphs,
    });
  }

  const valuationParagraphs = splitIntoParagraphs(summary.valuationContext, 2);
  if (valuationParagraphs.length > 0) {
    sections.push({
      id: "valuation",
      title: "Valuation context",
      paragraphs: valuationParagraphs,
    });
  }

  if (summary.keyStrengths.length > 0) {
    sections.push({
      id: "strengths",
      title: "Key strengths",
      bullets: summary.keyStrengths,
    });
  }

  if (summary.keyRisks.length > 0) {
    sections.push({
      id: "risks",
      title: "Key risks",
      bullets: summary.keyRisks,
    });
  }

  if (summary.whatToWatch.length > 0) {
    sections.push({
      id: "what-to-watch",
      title: "What to watch",
      bullets: summary.whatToWatch,
    });
  }

  return sections;
}
