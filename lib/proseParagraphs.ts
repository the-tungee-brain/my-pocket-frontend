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
