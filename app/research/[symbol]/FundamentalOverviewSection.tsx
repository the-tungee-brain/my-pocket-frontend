"use client";

import {
  ResearchAtAGlanceBox,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import type { FundamentalsOverview } from "@/app/hooks/useFundamentals";
import { Skeleton } from "@/components/ui/Skeleton";
import { appCalloutClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { InvestmentThesisSection } from "./InvestmentThesisSection";
import { ValuationConclusionSection } from "./ValuationConclusionSection";
import { ValuationSummarySection } from "./ValuationSummarySection";

type FundamentalOverviewSectionProps = {
  overview: FundamentalsOverview | null | undefined;
  fallbackNote?: string | null;
  isEtf?: boolean;
};

export function FundamentalOverviewSection({
  overview,
  fallbackNote,
  isEtf = false,
}: FundamentalOverviewSectionProps) {
  if (overview) {
    const valuationTitle = isEtf ? "Cost & composition" : "What is priced in";
    const hasConclusion = Boolean(overview.valuationConclusion?.trim());
    const hasThesis =
      (overview.investmentThesis?.bullCase?.length ?? 0) > 0 ||
      (overview.investmentThesis?.bearCase?.length ?? 0) > 0;
    const showSummary =
      Boolean(overview.valuationSummary?.trim()) &&
      overview.valuationSummary?.trim() !== overview.valuationConclusion?.trim();

    return (
      <div className="app-stack">
        {hasConclusion ? (
          <ResearchAtAGlanceBox title="At a glance">
            <ValuationConclusionSection overview={overview} />
          </ResearchAtAGlanceBox>
        ) : null}

        {showSummary ? (
          <ResearchTextBlock title={valuationTitle}>
            <ValuationSummarySection overview={overview} />
          </ResearchTextBlock>
        ) : null}

        {hasThesis ? (
          <InvestmentThesisSection thesis={overview.investmentThesis} />
        ) : null}

        {overview.streetContext ? (
          <ResearchTextBlock title="Street context">
            <p>{overview.streetContext}</p>
          </ResearchTextBlock>
        ) : null}
      </div>
    );
  }

  if (fallbackNote) {
    return (
      <p className="text-sm leading-relaxed text-foreground">{fallbackNote}</p>
    );
  }

  return null;
}

export function FundamentalOverviewSkeleton() {
  return (
    <div className="app-stack">
      <div className={cn(appCalloutClass, "space-y-2")}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}
