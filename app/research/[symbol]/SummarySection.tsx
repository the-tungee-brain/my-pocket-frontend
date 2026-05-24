"use client";

import { useStockSummary } from "@/app/hooks/useStockSummary";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";

type SummarySectionProps = {
  symbol: string;
};

export function SummarySection({ symbol }: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { summary, isLoading, error } = useStockSummary(symbol, {
    accessToken,
  });

  const sentiment = summary?.sentiment;

  const sentimentClasses =
    sentiment === "Bullish"
      ? "bg-accent-muted text-accent-strong border-accent/30"
      : sentiment === "Bearish"
        ? "bg-danger/10 text-danger border-danger/30"
        : "bg-muted-bg text-muted border-border";

  if (isLoading && !summary) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted-bg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-danger">{error}</p>;
  }

  if (!summary) {
    return (
      <p className="text-sm text-muted">Summary is not available for this symbol.</p>
    );
  }

  return (
    <div className="space-y-6">
      {sentiment && (
        <div className="flex justify-end">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              sentimentClasses,
            )}
          >
            AI sentiment: {sentiment}
          </span>
        </div>
      )}

      <ResearchTextBlock title="At a glance">
        <p className="mb-3">{summary.short}</p>
        <p>{summary.long}</p>
      </ResearchTextBlock>

      {summary.investmentThesis && (
        <div className="rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            Investment thesis
          </h3>
          <p className="text-sm leading-relaxed text-foreground">
            {summary.investmentThesis}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ResearchBulletList
          title="Key strengths"
          items={summary.keyStrengths ?? []}
        />
        <ResearchBulletList
          title="Key risks"
          items={summary.keyRisks ?? []}
          variant="risk"
        />
      </div>

      <ResearchBulletList
        title="What to watch"
        items={summary.whatToWatch ?? []}
        variant="watch"
      />

      {summary.valuationContext && (
        <ResearchTextBlock title="Valuation context">
          <p>{summary.valuationContext}</p>
        </ResearchTextBlock>
      )}
    </div>
  );
}
