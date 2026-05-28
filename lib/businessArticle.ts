import type { BusinessBlock } from "@/app/hooks/useBusinessDetails";
import { splitIntoParagraphs } from "@/lib/bigPictureArticle";

export const BUSINESS_PROSE_PREVIEW_SENTENCES = 3;
export const BUSINESS_REVENUE_PREVIEW_SENTENCES = 4;

/** One sentence per entry — reuses Big Picture paragraph splitting. */
export function splitIntoSentences(text: string): string[] {
  return splitIntoParagraphs(text.trim(), 1);
}

/** Scan bullets — model, growth, and risk only (whatTheyDo lives in the hook below). */
export function buildBusinessAtAGlance(business: BusinessBlock): string[] {
  const points: string[] = [];

  const revenueLead = splitIntoSentences(business.revenueNotes)[0];
  if (revenueLead) points.push(revenueLead);

  const growth = business.growthDrivers?.[0]?.trim();
  if (growth) points.push(growth);

  const risk = business.keyRisks?.[0]?.trim();
  if (risk) points.push(risk);

  return points.slice(0, 3);
}
