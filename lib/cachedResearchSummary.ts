import type { CachedResearchSnippet } from "@/app/types/intelligence";
import type { StockSummary } from "@/app/hooks/useStockSummary";

function normalizeSentiment(
  value: string | null | undefined,
): StockSummary["sentiment"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "bullish") return "Bullish";
  if (normalized === "bearish") return "Bearish";
  return "Neutral";
}

export function hasCachedResearchContent(
  cached: CachedResearchSnippet | null | undefined,
): boolean {
  if (!cached) return false;
  return (
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
  return {
    short: thesis.length > 280 ? `${thesis.slice(0, 277)}…` : thesis,
    long: thesis,
    sentiment: normalizeSentiment(cached.sentiment),
    investmentThesis: thesis,
    keyStrengths: cached.keyStrengths ?? [],
    keyRisks: cached.keyRisks ?? [],
    whatToWatch: cached.whatToWatch ?? [],
    valuationContext: cached.valuationContext?.trim() ?? "",
  };
}
