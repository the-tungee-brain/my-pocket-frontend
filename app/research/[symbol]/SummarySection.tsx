"use client";

import { FileText, Info } from "lucide-react";
import { useStockSummary } from "@/app/hooks/useStockSummary";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  ResearchAsideCard,
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import { PageSplit } from "@/components/PageShell";
import { pageAsideClass } from "@/lib/pageLayout";
import { StreamingResearchContent } from "@/components/StreamingResearchContent";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";

type SummarySectionProps = {
  symbol: string;
};

function sentimentClasses(sentiment: string) {
  return sentiment === "Bullish"
    ? "bg-accent-muted text-accent-strong border-accent/30"
    : sentiment === "Bearish"
      ? "bg-danger/10 text-danger border-danger/30"
      : "bg-muted-bg text-muted border-border";
}

export function SummarySection({ symbol }: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { summary, streamMarkdown, isStreaming, isLoading, error } =
    useStockSummary(symbol, {
      accessToken,
    });

  if (isLoading && !summary && !streamMarkdown) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted-bg" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted-bg" />
            <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
          </div>
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-muted-bg" />
      </div>
    );
  }

  if (error && !summary && !streamMarkdown) {
    return <ErrorBanner message={error} />;
  }

  if (!summary && streamMarkdown) {
    return (
      <div className="space-y-4">
        <BigPictureHeader />
        <StreamingResearchContent
          markdown={streamMarkdown}
          isStreaming={isStreaming}
          statusLabel="Generating summary…"
        />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-4">
        <BigPictureHeader />
        <EmptyState
          icon={FileText}
          title="Summary unavailable"
          description={`We don't have a summary for ${symbol} right now.`}
          variant="solid"
          className="py-6"
        />
      </div>
    );
  }

  const hasAside =
    !!summary.investmentThesis || (summary.whatToWatch?.length ?? 0) > 0;

  const asideContent =
    hasAside ? (
      <>
        {summary.investmentThesis && (
          <ResearchAsideCard title="Investment thesis" tone="accent">
            <p className="text-sm leading-relaxed text-foreground">
              {summary.investmentThesis}
            </p>
          </ResearchAsideCard>
        )}

        {(summary.whatToWatch?.length ?? 0) > 0 && (
          <ResearchAsideCard title="What to watch" tone="watch">
            <ResearchBulletList
              hideTitle
              items={summary.whatToWatch ?? []}
              variant="watch"
            />
          </ResearchAsideCard>
        )}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <BigPictureHeader sentiment={summary.sentiment} />

      <div className="rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          At a glance
        </h3>
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {summary.short}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {summary.long}
        </p>
      </div>

      {summary.valuationContext && asideContent ? (
        <PageSplit
          main={
            <ResearchTextBlock title="Valuation context">
              <p>{summary.valuationContext}</p>
            </ResearchTextBlock>
          }
          aside={asideContent}
        />
      ) : summary.valuationContext ? (
        <ResearchTextBlock title="Valuation context">
          <p>{summary.valuationContext}</p>
        </ResearchTextBlock>
      ) : asideContent ? (
        <div className={pageAsideClass}>{asideContent}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
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
    </div>
  );
}

function BigPictureHeader({ sentiment }: { sentiment?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-muted text-accent-strong">
          <Info className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Big picture</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            In-depth overview, thesis, strengths, risks, and valuation
          </p>
        </div>
      </div>
      {sentiment && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            sentimentClasses(sentiment),
          )}
        >
          AI sentiment: {sentiment}
        </span>
      )}
    </div>
  );
}
