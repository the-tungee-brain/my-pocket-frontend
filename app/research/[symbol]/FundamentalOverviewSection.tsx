"use client";

import {
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import type { FundamentalsOverview } from "@/app/hooks/useFundamentals";

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
    const valuationTitle = isEtf ? "Cost & composition" : "Valuation take";

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            At a glance
          </h3>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {overview.atAGlance}
          </p>
        </div>

        {overview.valuationTake ? (
          <ResearchTextBlock title={valuationTitle}>
            <p>{overview.valuationTake}</p>
          </ResearchTextBlock>
        ) : null}

        {(overview.strengths.length > 0 || overview.concerns.length > 0) && (
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            <ResearchBulletList
              title="Fundamental strengths"
              items={overview.strengths}
            />
            <ResearchBulletList
              title="Key concerns"
              items={overview.concerns}
              variant="risk"
            />
          </div>
        )}

        {overview.assumptions ? (
          <ResearchTextBlock title="What you'd need to believe">
            <p>{overview.assumptions}</p>
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
    <div className="space-y-5">
      <div className="space-y-2 rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
        <div className="h-3 w-20 animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted-bg" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted-bg" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-muted-bg" />
        <div className="h-24 animate-pulse rounded-xl bg-muted-bg" />
      </div>
    </div>
  );
}
