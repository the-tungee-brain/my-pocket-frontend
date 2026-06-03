"use client";

import type { FundamentalsOverview } from "@/app/hooks/useFundamentals";

type ValuationConclusionSectionProps = {
  overview: FundamentalsOverview | null | undefined;
};

export function ValuationConclusionSection({
  overview,
}: ValuationConclusionSectionProps) {
  const conclusion = overview?.valuationConclusion?.trim();
  if (!conclusion) return null;

  return (
    <p className="text-sm font-medium leading-relaxed text-foreground">
      {conclusion}
    </p>
  );
}
