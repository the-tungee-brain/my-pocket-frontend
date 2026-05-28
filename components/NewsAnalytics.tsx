"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { ChevronDown, Newspaper, RefreshCw } from "lucide-react";
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
    <div className="news-tab__mix" aria-label="Sentiment mix in recent headlines">
      <div className="news-tab__mix-bar">
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <div
                key={seg.key}
                className={cn("news-tab__mix-segment", seg.className)}
                style={{ width: `${(seg.count / total) * 100}%` }}
                title={`${sentimentLabel(seg.key)}: ${seg.count}`}
              />
            ),
        )}
      </div>
      <div className="news-tab__mix-legend">
        {segments.map((seg) => (
          <span key={seg.key} className="news-tab__mix-label">
            <span
              className={cn("news-tab__mix-dot", seg.className)}
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

function NewsArticleRow({
  item,
  expanded,
  onToggle,
}: {
  item: EnrichedNewsItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const imageUrl = item.image?.toString();

  return (
    <li className="news-tab__article">
      <button
        type="button"
        className="news-tab__article-trigger"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="news-tab__article-thumb"
            loading="lazy"
          />
        ) : (
          <div className="news-tab__article-thumb news-tab__article-thumb--placeholder">
            <Newspaper className="h-4 w-4 text-muted" aria-hidden />
          </div>
        )}
        <span className="min-w-0 flex-1 text-left">
          <span className="flex flex-wrap items-start gap-2">
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
              {item.headline}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                sentimentColor(item.sentiment),
              )}
            >
              {sentimentLabel(item.sentiment)}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
            <time dateTime={item.datetime}>
              {new Date(item.datetime).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            {item.source ? <span>{item.source}</span> : null}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="news-tab__article-body">
          <p className="text-sm leading-relaxed text-foreground">{item.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-accent-strong hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Read source
              </a>
            ) : null}
            <span className="text-[11px] text-muted">
              Confidence {(item.confidence * 100).toFixed(0)}%
            </span>
            {item.topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex rounded-full bg-muted-bg px-2 py-px text-[11px] text-muted"
              >
                {topic.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      ) : null}
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
              {actionabilityScore == null ? "N/A" : `${actionabilityScore}/5`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted-bg">
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
    </ResearchAsideCard>
  );
}

function NewsAnalysisAside({ data }: { data: StockNewsView }) {
  return (
    <>
      {data.insights.length > 0 ? (
        <ResearchAsideCard title="Key insights">
          <ResearchBulletList items={data.insights.slice(0, 4)} hideTitle />
        </ResearchAsideCard>
      ) : null}

      {data.risks.length > 0 ? (
        <ResearchAsideCard title="Risks">
          <ResearchBulletList
            items={data.risks.slice(0, 4)}
            variant="risk"
            hideTitle
          />
        </ResearchAsideCard>
      ) : null}

      {data.deepAnalysis ? (
        <ResearchAsideCard title="Deep analysis">
          <p className="text-sm leading-relaxed text-foreground">
            {data.deepAnalysis}
          </p>
        </ResearchAsideCard>
      ) : null}
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
  const [filter, setFilter] = useState<SentimentFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

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
    if (!data?.items.length) {
      setExpandedIds(new Set());
      return;
    }
    setExpandedIds(new Set([data.items[0].id]));
    setFilter("all");
  }, [data?.symbol, data?.items.length]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setExpandedIds(new Set());
      return;
    }
    setExpandedIds((current) => {
      const visible = new Set(filteredItems.map((item) => item.id));
      const kept = [...current].filter((id) => visible.has(id));
      if (kept.length > 0) return new Set(kept);
      return new Set([filteredItems[0].id]);
    });
  }, [filter, filteredItems]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredItems.map((item) => item.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (!data && !isLoading) return null;

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  const asideLoading = isLoading && !data;

  return (
    <div className="news-tab space-y-5">
      <header className="news-tab__header">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <Newspaper className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">News</h2>
              {data ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
                    overallSentimentPillClass(data.overall_sentiment),
                  )}
                >
                  {overallSentimentLabel(data.overall_sentiment)}
                </span>
              ) : (
                <Skeleton className="h-5 w-16 rounded-full" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {data
                ? `${data.items.length} headlines · AI-enriched`
                : "Loading headlines…"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-muted">
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
      </header>

      {data ? (
        <div className="news-tab__summary" aria-labelledby="news-summary">
          <h3 id="news-summary" className="news-tab__summary-title">
            What matters
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
          {data.investorTakeaway ? (
            <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
              {data.investorTakeaway}
            </p>
          ) : null}
        </div>
      ) : (
        <Skeleton className="h-24 rounded-xl" />
      )}

      {data && data.items.length > 0 ? <SentimentMixBar items={data.items} /> : null}

      <PageSplit
        main={
          <div className="space-y-3">
            {data ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
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
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      className="font-medium text-accent-strong hover:underline"
                      onClick={expandAll}
                    >
                      Expand all
                    </button>
                    <span className="text-muted" aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      className="font-medium text-muted hover:text-foreground hover:underline"
                      onClick={collapseAll}
                    >
                      Collapse all
                    </button>
                  </div>
                </div>

                <ul className="news-tab__feed">
                  {filteredItems.map((item) => (
                    <NewsArticleRow
                      key={item.id}
                      item={item}
                      expanded={expandedIds.has(item.id)}
                      onToggle={() => toggleExpanded(item.id)}
                    />
                  ))}
                </ul>

                {filteredItems.length === 0 ? (
                  <p className="rounded-lg border border-border bg-muted-bg/40 px-3 py-4 text-sm text-muted">
                    No {filter === "all" ? "" : `${filter} `}headlines in this
                    batch. Try another filter.
                  </p>
                ) : null}
              </>
            ) : (
              <ul className="space-y-0">
                {[1, 2, 3, 4].map((row) => (
                  <li key={row} className="border-b border-border py-4">
                    <Skeleton className="h-12 w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
        aside={
          data ? (
            <>
              <NewsMetricsAside data={data} />
              <NewsAnalysisAside data={data} />
            </>
          ) : asideLoading ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
