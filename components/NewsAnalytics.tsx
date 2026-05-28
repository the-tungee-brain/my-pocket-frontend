"use client";

import type {
  EnrichedNewsItem,
  StockNewsView,
  Sentiment,
  OverallSentiment,
} from "@/app/hooks/useCompanyNews";
import { PageSplit } from "@/components/PageShell";
import {
  ResearchAsideCard,
  ResearchBulletList,
} from "@/components/ResearchDetailBlocks";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { RefreshCw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

function sentimentColor(sentiment: Sentiment) {
  switch (sentiment) {
    case "bullish":
      return "bg-accent-muted text-accent-strong ring-1 ring-accent/30";
    case "bearish":
      return "bg-danger/10 text-danger ring-1 ring-danger/30";
    case "neutral":
    default:
      return "bg-muted-bg text-muted ring-1 ring-border";
  }
}

function overallSentimentLabel(s: OverallSentiment) {
  switch (s) {
    case "strongly_bullish":
      return "Strongly Bullish";
    case "bullish":
      return "Bullish";
    case "neutral":
      return "Neutral";
    case "bearish":
      return "Bearish";
    case "strongly_bearish":
      return "Strongly Bearish";
  }
}

function overallSentimentColor(s: OverallSentiment) {
  switch (s) {
    case "strongly_bullish":
      return "bg-accent-muted text-accent-strong border border-accent/40";
    case "bullish":
      return "bg-accent-muted/70 text-accent-strong border border-accent/30";
    case "neutral":
      return "bg-muted-bg text-foreground border border-border";
    case "bearish":
      return "bg-danger/10 text-danger border border-danger/30";
    case "strongly_bearish":
      return "bg-danger/15 text-danger border border-danger/40";
  }
}

function formatMetadataValue(value: string | null | undefined) {
  if (!value) return "Not available";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function actionabilityTone(score: number | null | undefined) {
  if (score == null) return "text-muted";
  if (score >= 4) return "text-success";
  if (score >= 3) return "text-accent-strong";
  return "text-muted";
}

function sentimentLabel(sentiment: Sentiment) {
  switch (sentiment) {
    case "bullish":
      return "Bullish";
    case "bearish":
      return "Bearish";
    default:
      return "Neutral";
  }
}

function NewsArticleCard({ item }: { item: EnrichedNewsItem }) {
  return (
    <li>
      <Card as="div" surface="subtle" className="mx-0 px-4 py-3 shadow-sm">
      <div className="mb-1.5 flex flex-wrap items-start gap-2">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 font-medium text-foreground underline-offset-2 hover:text-accent-strong hover:underline"
          >
            {item.headline}
          </a>
        ) : (
          <span className="min-w-0 flex-1 font-medium text-foreground">
            {item.headline}
          </span>
        )}
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            sentimentColor(item.sentiment),
          )}
        >
          {sentimentLabel(item.sentiment)}
          <span className="ml-1 text-[10px] opacity-70">
            {(item.confidence * 100).toFixed(0)}%
          </span>
        </span>
      </div>

      <p className="text-[13px] leading-relaxed text-muted">{item.summary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted">
          {new Date(item.datetime).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {item.source ? (
          <>
            <span className="text-[11px] text-muted" aria-hidden>
              ·
            </span>
            <span className="font-mono text-[11px] font-semibold text-accent-strong">
              {item.source}
            </span>
          </>
        ) : null}
        {item.topics.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center rounded-full bg-muted-bg px-2 py-px text-[11px] text-muted"
          >
            {topic}
          </span>
        ))}
      </div>
      </Card>
    </li>
  );
}

function NewsMetricsAside({ data }: { data: StockNewsView }) {
  const actionabilityScore = data.actionability_score ?? null;
  const actionabilityPercent =
    actionabilityScore == null
      ? 0
      : Math.max(0, Math.min(100, (actionabilityScore / 5) * 100));

  return (
    <ResearchAsideCard title="At a glance">
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Dominant driver
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatMetadataValue(data.dominant_driver)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Impact horizon
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatMetadataValue(data.market_impact_horizon)}
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Actionability
            </p>
            <span
              className={cn(
                "text-xs font-semibold",
                actionabilityTone(actionabilityScore),
              )}
            >
              {actionabilityScore == null ? "N/A" : actionabilityScore}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted-bg">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                actionabilityTone(actionabilityScore),
                "bg-current",
              )}
              style={{ width: `${actionabilityPercent}%` }}
            />
          </div>
        </div>
      </div>
    </ResearchAsideCard>
  );
}

function NewsAnalysisAside({ data }: { data: StockNewsView }) {
  const hasInsights = data.insights.length > 0;
  const hasRisks = data.risks.length > 0;
  const hasTakeaway = !!data.investorTakeaway;
  const hasDeepAnalysis = !!data.deepAnalysis;

  return (
    <>
      {hasTakeaway && (
        <ResearchAsideCard title="Investor takeaway" tone="accent">
          <p className="text-sm leading-relaxed text-foreground">
            {data.investorTakeaway}
          </p>
        </ResearchAsideCard>
      )}

      <NewsMetricsAside data={data} />

      {hasInsights && (
        <ResearchAsideCard title="Key insights">
          <ResearchBulletList items={data.insights} hideTitle />
        </ResearchAsideCard>
      )}

      {hasRisks && (
        <ResearchAsideCard title="Risks">
          <ResearchBulletList items={data.risks} variant="risk" hideTitle />
        </ResearchAsideCard>
      )}

      {hasDeepAnalysis && (
        <ResearchAsideCard title="Deep analysis">
          <p className="text-sm leading-relaxed text-foreground">
            {data.deepAnalysis}
          </p>
        </ResearchAsideCard>
      )}
    </>
  );
}

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  lastUpdated?: number | null;
  onRefresh?: () => void;
};

export default function NewsAnalytics({
  analytics,
  isLoading,
  lastUpdated = null,
  onRefresh,
}: Props) {
  const data = analytics;

  if (!data && !isLoading) return null;

  const sentimentClass = data
    ? overallSentimentColor(data.overall_sentiment)
    : "border border-border bg-muted-bg text-foreground";

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  const aside = data ? (
    <NewsAnalysisAside data={data} />
  ) : isLoading ? (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Card
        as="div"
        className={cn("mx-0 px-4 py-4 shadow-sm sm:px-5", sentimentClass)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-background/40 px-2 text-xs font-medium uppercase tracking-wide text-muted">
              News sentiment
            </span>
            <span className="inline-flex items-center rounded-full bg-background/50 px-2.5 py-1 text-xs font-semibold text-foreground">
              {data
                ? overallSentimentLabel(data.overall_sentiment)
                : "Loading…"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">
              {isLoading ? "Updating…" : updatedLabel}
            </span>
            {onRefresh && (
              <IconButton
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh news"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
                  aria-hidden
                />
              </IconButton>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm leading-relaxed text-foreground">
          {data ? data.summary : <Skeleton className="h-4 w-3/4" />}
        </div>
      </Card>

      <PageSplit
        main={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Recent news flow
              </h2>
              <span className="text-[11px] text-muted">
                {data ? `${data.items.length} articles analyzed` : "Loading…"}
              </span>
            </div>

            <ul className="space-y-3">
              {data?.items.map((item) => (
                <NewsArticleCard key={item.id} item={item} />
              ))}

              {!data && isLoading &&
                [1, 2, 3].map((row) => (
                  <li key={row}>
                    <Skeleton className="h-28 rounded-xl" />
                  </li>
                ))}
            </ul>
          </>
        }
        aside={aside ?? undefined}
      />
    </div>
  );
}
