"use client";

import type { FundamentalsOverview } from "@/app/hooks/useFundamentals";

type ValuationSummarySectionProps = {
  overview: FundamentalsOverview | null | undefined;
};

export function ValuationSummarySection({ overview }: ValuationSummarySectionProps) {
  const summary = overview?.valuationSummary?.trim();
  if (!summary) return null;
  if (summary === overview?.valuationConclusion?.trim()) return null;

  return (
    <p className="text-sm leading-relaxed text-muted">{summary}</p>
  );
}
