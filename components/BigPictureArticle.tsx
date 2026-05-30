"use client";

import { Info } from "lucide-react";
import { appCalloutClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import {
  buildBigPictureSections,
  buildKeyTakeaways,
} from "@/lib/bigPictureArticle";
import type { StockSummary } from "@/app/hooks/useStockSummary";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ResearchAtAGlanceBox,
  ResearchAsideCard,
  ResearchBulletList,
  ResearchPairedBulletLists,
  ResearchProseText,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";

type BigPictureArticleProps = {
  summary: StockSummary;
  symbol: string;
  className?: string;
};

function sentimentBadge(sentiment: StockSummary["sentiment"]) {
  const tone =
    sentiment === "Bullish"
      ? "border-accent/30 bg-accent-muted text-accent-strong"
      : sentiment === "Bearish"
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-border bg-muted-bg text-muted";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
        tone,
      )}
    >
      {sentiment}
    </span>
  );
}

export function BigPictureOverviewSkeleton() {
  return (
    <div className="app-stack">
      <div className={cn(appCalloutClass, "space-y-2")}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-full" />
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

export function BigPictureArticle({
  summary,
  symbol: _symbol,
  className,
}: BigPictureArticleProps) {
  const keyTakeaways = buildKeyTakeaways(summary);
  const sections = buildBigPictureSections(summary);

  const proseSections = sections.filter((section) => (section.paragraphs?.length ?? 0) > 0);
  const strengthsSection = sections.find((section) => section.id === "strengths");
  const risksSection = sections.find((section) => section.id === "risks");
  const watchSection = sections.find((section) => section.id === "what-to-watch");
  const calloutSections = sections.filter((section) => section.callout?.trim());

  return (
    <ResearchSectionCard
      className={className}
      title="Big picture"
      description="AI overview — thesis, valuation, strengths, and risks"
      icon={Info}
      action={sentimentBadge(summary.sentiment)}
    >
      <div className="app-stack">
        <ResearchAtAGlanceBox title="Key takeaways">
          <ul className="space-y-1.5 text-sm font-medium leading-relaxed text-foreground">
            {keyTakeaways.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </ResearchAtAGlanceBox>

        {proseSections.map((section) => (
          <ResearchTextBlock key={section.id} title={section.title}>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </ResearchTextBlock>
        ))}

        {(strengthsSection?.bullets?.length || risksSection?.bullets?.length) ? (
          <ResearchPairedBulletLists
            left={{
              title: "Key strengths",
              items: strengthsSection?.bullets ?? [],
            }}
            right={{
              title: "Key risks",
              items: risksSection?.bullets ?? [],
              variant: "risk",
            }}
          />
        ) : null}

        {watchSection?.bullets && watchSection.bullets.length > 0 ? (
          <ResearchBulletList
            title="What to watch"
            items={watchSection.bullets}
            variant="watch"
          />
        ) : null}

        {calloutSections.map((section) => (
          <ResearchAsideCard key={section.id} title={section.title} tone="watch">
            <p className="text-sm italic leading-relaxed">{section.callout}</p>
          </ResearchAsideCard>
        ))}
      </div>
    </ResearchSectionCard>
  );
}
