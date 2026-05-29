"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EnrichedNewsItem,
  StockNewsView,
  Sentiment,
  OverallSentiment,
} from "@/app/hooks/useCompanyNews";
import { PageSplit } from "@/components/PageShell";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchAtAGlanceBox,
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { Activity, List, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

type SentimentFilter = "all" | Sentiment;

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
      return "Strongly bullish";
    case "bullish":
      return "Bullish";
    case "neutral":
      return "Neutral";
    case "bearish":
      return "Bearish";
    case "strongly_bearish":
      return "Strongly bearish";
  }
}

function overallSentimentPillClass(s: OverallSentiment) {
  switch (s) {
    case "strongly_bullish":
    case "bullish":
      return "border-accent/30 bg-accent-muted text-accent-strong";
    case "bearish":
    case "strongly_bearish":
      return "border-danger/30 bg-danger/10 text-danger";
    default:
      return "border-border bg-muted-bg text-muted";
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

function countBySentiment(items: EnrichedNewsItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.sentiment] += 1;
      return acc;
    },
    { bullish: 0, bearish: 0, neutral: 0 },
  );
}

function SentimentMixBar({ items }: { items: EnrichedNewsItem[] }) {
  const counts = countBySentiment(items);
  const total = items.length || 1;
  const segments: { key: Sentiment; count: number; className: string }[] = [
    { key: "bullish", count: counts.bullish, className: "bg-accent-strong" },
    { key: "neutral", count: counts.neutral, className: "bg-muted" },
    { key: "bearish", count: counts.bearish, className: "bg-danger" },
  ];

  return (
    <div className="flex flex-col gap-2" aria-label="Sentiment mix in recent headlines">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted-bg">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.key}
                className={cn("min-w-1 transition-[width]", seg.className)}
                style={{ width: `${(seg.count / total) * 100}%` }}
                title={`${sentimentLabel(seg.key)}: ${seg.count}`}
              />
            ),
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted"
          >
            <span
              className={cn("inline-block h-2 w-2 rounded-full", seg.className)}
              aria-hidden
            />
            {sentimentLabel(seg.key)} {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
        active
          ? "border-accent/40 bg-accent-muted text-accent-strong"
          : "border-border bg-background text-muted hover:border-accent/30 hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums",
          active ? "text-accent-strong" : "text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function NewsArticleRow({ item }: { item: EnrichedNewsItem }) {
  const imageUrl = item.image?.toString();
  const headlineClass =
    "text-sm font-medium leading-snug text-foreground hover:text-accent-strong";

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="mt-0.5 h-10 w-10 shrink-0 rounded-md object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start gap-2">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("min-w-0 flex-1 hover:underline", headlineClass)}
              >
                {item.headline}
              </a>
            ) : (
              <p className={cn("min-w-0 flex-1", headlineClass)}>{item.headline}</p>
            )}
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                sentimentColor(item.sentiment),
              )}
            >
              {sentimentLabel(item.sentiment)}
            </span>
          </div>

          <p className="text-[11px] text-muted">
            <time dateTime={item.datetime}>
              {new Date(item.datetime).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            {item.source ? <span> · {item.source}</span> : null}
          </p>

          <p className="text-sm leading-relaxed text-muted">{item.summary}</p>

          {(item.topics.length > 0 || item.confidence > 0) && (
            <p className="text-[11px] text-muted">
              {item.confidence > 0 ? (
                <span>Confidence {(item.confidence * 100).toFixed(0)}%</span>
              ) : null}
              {item.confidence > 0 && item.topics.length > 0 ? <span> · </span> : null}
              {item.topics.length > 0 ? (
                <span>{item.topics.map((t) => t.replace(/_/g, " ")).join(" · ")}</span>
              ) : null}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function NewsOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function NewsHeadlinesSkeleton() {
  return (
    <div className="divide-y divide-border">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="space-y-2 py-4 first:pt-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function NewsContextAside({ data }: { data: StockNewsView }) {
  const actionabilityScore = data.actionability_score ?? null;
  const actionabilityPercent =
    actionabilityScore == null
      ? 0
      : Math.max(0, Math.min(100, (actionabilityScore / 5) * 100));

  return (
    <div className="space-y-5">
      <ResearchTextBlock title="Dominant driver">
        <p className="font-medium">{formatMetadataValue(data.dominant_driver)}</p>
      </ResearchTextBlock>

      <ResearchTextBlock title="Impact horizon">
        <p className="font-medium">
          {formatMetadataValue(data.market_impact_horizon)}
        </p>
      </ResearchTextBlock>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Actionability
          </h3>
          <span
            className={cn(
              "text-xs font-semibold",
              actionabilityTone(actionabilityScore),
            )}
          >
            {actionabilityScore == null ? "N/A" : `${actionabilityScore}/5`}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
          <div
            className={cn(
              "h-full rounded-full bg-current transition-all",
              actionabilityTone(actionabilityScore),
            )}
            style={{ width: `${actionabilityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function NewsAnalysisAside({ data }: { data: StockNewsView }) {
  const insights = data.insights.slice(0, 4);
  const risks = data.risks.slice(0, 4);

  return (
    <div className="space-y-5">
      {insights.length > 0 ? (
        <ResearchBulletList title="Key insights" items={insights} />
      ) : null}
      {risks.length > 0 ? (
        <ResearchBulletList title="Risks" items={risks} variant="risk" />
      ) : null}

      {data.deepAnalysis ? (
        <ResearchTextBlock title="Deep analysis">
          <p>{data.deepAnalysis}</p>
        </ResearchTextBlock>
      ) : null}
    </div>
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
  const [filter, setFilter] = useState<SentimentFilter>("all");

  const counts = useMemo(
    () => (data ? countBySentiment(data.items) : null),
    [data],
  );

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.items;
    return data.items.filter((item) => item.sentiment === filter);
  }, [data, filter]);

  useEffect(() => {
    setFilter("all");
  }, [data?.symbol, data?.items.length]);

  if (!data && !isLoading) return null;

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  const sentimentAction = data ? (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
        overallSentimentPillClass(data.overall_sentiment),
      )}
    >
      {overallSentimentLabel(data.overall_sentiment)}
    </span>
  ) : (
    <Skeleton className="h-5 w-20 rounded-full" />
  );

  const refreshAction = (
    <div className="flex shrink-0 items-center gap-2">
      {sentimentAction}
      <span className="hidden text-[11px] text-muted sm:inline">
        {isLoading ? "Updating…" : updatedLabel}
      </span>
      {onRefresh ? (
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
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageSplit
        main={
          <>
            <ResearchSectionCard
              title="News overview"
              description={
                data
                  ? `${data.items.length} headlines · AI-enriched`
                  : "Loading headlines…"
              }
              icon={Newspaper}
              action={refreshAction}
            >
              {isLoading && !data ? (
                <NewsOverviewSkeleton />
              ) : data ? (
                <div className="space-y-5">
                  <ResearchAtAGlanceBox title="What matters">
                    <p className="text-sm font-medium leading-relaxed text-foreground">
                      {data.summary}
                    </p>
                    {data.investorTakeaway ? (
                      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                        {data.investorTakeaway}
                      </p>
                    ) : null}
                  </ResearchAtAGlanceBox>

                  {data.items.length > 0 ? (
                    <ResearchTextBlock title="Sentiment mix">
                      <SentimentMixBar items={data.items} />
                    </ResearchTextBlock>
                  ) : null}
                </div>
              ) : null}
            </ResearchSectionCard>

            <ResearchSectionCard
              title="Headlines"
              description="Recent stories with AI summaries"
              icon={List}
            >
              {isLoading && !data ? (
                <NewsHeadlinesSkeleton />
              ) : data ? (
                <div className="space-y-4">
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Filter by sentiment"
                  >
                    <FilterChip
                      active={filter === "all"}
                      label="All"
                      count={data.items.length}
                      onClick={() => setFilter("all")}
                    />
                    <FilterChip
                      active={filter === "bullish"}
                      label="Bullish"
                      count={counts?.bullish ?? 0}
                      onClick={() => setFilter("bullish")}
                    />
                    <FilterChip
                      active={filter === "neutral"}
                      label="Neutral"
                      count={counts?.neutral ?? 0}
                      onClick={() => setFilter("neutral")}
                    />
                    <FilterChip
                      active={filter === "bearish"}
                      label="Bearish"
                      count={counts?.bearish ?? 0}
                      onClick={() => setFilter("bearish")}
                    />
                  </div>

                  {filteredItems.length > 0 ? (
                    <ul className="m-0 list-none divide-y divide-border p-0">
                      {filteredItems.map((item) => (
                        <NewsArticleRow key={item.id} item={item} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">
                      No {filter === "all" ? "" : `${filter} `}headlines in this
                      batch. Try another filter.
                    </p>
                  )}
                </div>
              ) : null}
            </ResearchSectionCard>
          </>
        }
        aside={
          isLoading && !data ? (
            <div className="space-y-4" aria-hidden>
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : data ? (
            <>
              <ResearchSectionCard
                title="Market context"
                description="How recent news may affect the stock"
                icon={Activity}
              >
                <NewsContextAside data={data} />
              </ResearchSectionCard>

              {(data.insights.length > 0 ||
                data.risks.length > 0 ||
                data.deepAnalysis) && (
                <ResearchSectionCard
                  title="Coverage analysis"
                  description="Themes and risks from recent headlines"
                  icon={Sparkles}
                >
                  <NewsAnalysisAside data={data} />
                </ResearchSectionCard>
              )}
            </>
          ) : undefined
        }
      />
    </div>
  );
}
