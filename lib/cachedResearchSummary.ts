import type { CachedResearchSnippet } from "@/app/types/intelligence";
import type { StockSummary } from "@/app/hooks/useStockSummary";
import { splitIntoParagraphs } from "@/lib/bigPictureArticle";

function normalizeSentiment(
  value: string | null | undefined,
): StockSummary["sentiment"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "bullish") return "Bullish";
  if (normalized === "bearish") return "Bearish";
  return "Neutral";
}

function deriveShortFallback(thesis: string): string {
  if (!thesis) return "";
  const sentences = splitIntoParagraphs(thesis, 1);
  return sentences.slice(0, 2).join(" ") || thesis;
}

export function hasCachedResearchContent(
  cached: CachedResearchSnippet | null | undefined,
): boolean {
  if (!cached) return false;
  return (
    Boolean(cached.short?.trim()) ||
    Boolean(cached.investmentThesis?.trim()) ||
    (cached.keyStrengths?.length ?? 0) > 0 ||
    (cached.keyRisks?.length ?? 0) > 0 ||
    (cached.whatToWatch?.length ?? 0) > 0
  );
}

export function cachedResearchToStockSummary(
  cached: CachedResearchSnippet,
): StockSummary {
  const thesis = cached.investmentThesis?.trim() ?? "";
  const short = cached.short?.trim() || deriveShortFallback(thesis);
  const long = cached.long?.trim() || thesis;

  return {
    short,
    long,
    sentiment: normalizeSentiment(cached.sentiment),
    investmentThesis: thesis,
    keyStrengths: cached.keyStrengths ?? [],
    keyRisks: cached.keyRisks ?? [],
    whatToWatch: cached.whatToWatch ?? [],
    valuationContext: cached.valuationContext?.trim() ?? "",
  };
}
