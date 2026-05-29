"use client";

import {
  ResearchAtAGlanceBox,
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import type { FundamentalsOverview } from "@/app/hooks/useFundamentals";
import { Skeleton } from "@/components/ui/Skeleton";
import { appHighlightClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

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
      <div className="app-stack">
        <ResearchAtAGlanceBox>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {overview.atAGlance}
          </p>
        </ResearchAtAGlanceBox>

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
    <div className="app-stack">
      <div className={cn(appHighlightClass, "space-y-2")}>
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
