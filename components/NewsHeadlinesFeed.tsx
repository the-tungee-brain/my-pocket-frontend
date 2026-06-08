"use client";

import { LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import type { EnrichedNewsItem, Sentiment } from "@/app/hooks/useCompanyNews";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";
import { LoadingStagger, LoadingSurface } from "@/components/ui/ContentLoading";
import { LoadingRegion } from "@/components/ui/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

export type HeadlinesView = "list" | "grid";
export type NewsFeedKind = "official" | "coverage";
type SentimentFilter = "all" | Sentiment;

export type NewsHeadlineDisplayItem = {
  id: string | number;
  datetime: string;
  headline: string;
  source?: string;
  summary?: string | null;
  url?: string | null;
  sentiment?: Sentiment;
  confidence?: number;
  topics?: string[];
  directRelevance?: EnrichedNewsItem["direct_relevance"];
  thesisImpact?: EnrichedNewsItem["thesis_impact"];
  thesisHorizon?: EnrichedNewsItem["thesis_horizon"];
  symbol?: string;
  symbolHref?: string;
  portfolioWeightPct?: number | null;
  feedKind?: NewsFeedKind;
};

export function enrichedNewsItemToDisplay(
  item: EnrichedNewsItem,
): NewsHeadlineDisplayItem {
  return {
    id: item.id,
    datetime: item.datetime,
    headline: item.headline,
    source: item.source,
    summary: item.summary,
    url: item.url,
    sentiment: item.sentiment,
    confidence: item.confidence,
    topics: item.topics,
    directRelevance: item.direct_relevance,
    thesisImpact: item.thesis_impact,
    thesisHorizon: item.thesis_horizon,
    feedKind: "coverage",
  };
}

export type PressReleaseHeadline = {
  headline: string;
  summary?: string | null;
  source: string;
  datetime: string;
  url?: string | null;
};

export function pressReleaseToDisplay(
  item: PressReleaseHeadline,
  index: number,
): NewsHeadlineDisplayItem {
  return {
    id: `${item.headline}-${item.datetime}-${index}`,
    datetime: item.datetime,
    headline: item.headline,
    source: item.source,
    summary: item.summary,
    url: item.url,
    sentiment: "neutral",
    confidence: 0,
    topics: [],
    feedKind: "official",
  };
}

export function portfolioNewsItemToDisplay(
  item: PortfolioHoldingsNewsItem,
  index: number,
): NewsHeadlineDisplayItem {
  return {
    id: `${item.symbol}-${item.url ?? item.headline}-${index}`,
    datetime: item.publishedAt ?? new Date(0).toISOString(),
    headline: item.headline,
    source: item.source ?? undefined,
    summary: item.summary,
    url: item.url,
    sentiment: "neutral",
    confidence: 0,
    topics: [],
    symbol: item.symbol,
    symbolHref: symbolHubPath(item.symbol),
    portfolioWeightPct: item.weightPct,
  };
}

function sentimentColor(sentiment: Sentiment) {
  switch (sentiment) {
    case "bullish":
      return "bg-success/10 text-success ring-1 ring-success/30";
    case "bearish":
      return "bg-danger/10 text-danger ring-1 ring-danger/30";
    default:
      return "bg-muted-bg text-muted ring-1 ring-border";
  }
}

function sentimentLabel(sentiment: Sentiment) {
  switch (sentiment) {
    case "bullish":
      return "Positive tone";
    case "bearish":
      return "Negative tone";
    default:
      return "Mixed/Neutral tone";
  }
}

function sentimentFilterLabel(sentiment: SentimentFilter) {
  if (sentiment === "all") return "All";
  return sentimentLabel(sentiment);
}

function countBySentiment(items: NewsHeadlineDisplayItem[]) {
  return items.reduce(
    (acc, item) => {
      const key = item.sentiment ?? "neutral";
      acc[key] += 1;
      return acc;
    },
    { bullish: 0, bearish: 0, neutral: 0 },
  );
}

const NEWS_HEADLINE_TITLE_SLOT = "h-10";
const NEWS_HEADLINE_SUMMARY_SLOT = "h-12";

const NEWS_HEADLINE_CLAMP =
  "line-clamp-2 w-full min-w-0 max-w-full overflow-hidden break-words text-sm [overflow-wrap:anywhere]";

/** Responds to parent width (split panes, cards), not only viewport. */
export const NEWS_HEADLINES_PANEL_CONTAINER_CLASS =
  "@container/headlines min-w-0 w-full max-w-full";

/** 1 col on mobile; 2 cols from sm up; 1 col again in narrow split panes. */
export const NEWS_HEADLINES_GRID_CLASS =
  "grid w-full min-w-0 max-w-full grid-cols-1 auto-rows-fr gap-3 sm:grid-cols-2 @max-headlines/md:grid-cols-1";

export const NEWS_HEADLINES_LIST_CLASS =
  "flex w-full min-w-0 max-w-full flex-col gap-3";

function NewsHeadlineClampedText({
  children,
  className,
  href,
  slotClass = NEWS_HEADLINE_SUMMARY_SLOT,
}: {
  children: ReactNode;
  className?: string;
  href?: string | null;
  slotClass?: string;
}) {
  const textClass = cn(NEWS_HEADLINE_CLAMP, className);

  return (
    <div className={cn(slotClass, "w-full min-w-0 shrink-0 overflow-hidden")}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(textClass, "hover:underline", className)}
        >
          {children}
        </a>
      ) : (
        <p className={cn(textClass, className)}>{children}</p>
      )}
    </div>
  );
}

function feedKindBadgeClass(kind: NewsFeedKind) {
  return kind === "official"
    ? "border-accent/25 bg-accent-muted/50 text-accent-strong"
    : "border-border bg-muted-bg text-muted";
}

function feedKindLabel(kind: NewsFeedKind) {
  return kind === "official" ? "Official" : "Coverage";
}

export function NewsHeadlineCard({
  item,
  view,
  showSentiment = true,
  showFeedKind = false,
}: {
  item: NewsHeadlineDisplayItem;
  view: HeadlinesView;
  showSentiment?: boolean;
  showFeedKind?: boolean;
}) {
  const sentiment = item.sentiment ?? "neutral";
  const kind = item.feedKind;

  const cardInner = (
    <>
      <div className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-1.5 overflow-hidden">
        {showFeedKind && kind ? (
          <span
            className={cn(
              "inline-flex w-fit max-w-full items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              feedKindBadgeClass(kind),
            )}
          >
            {feedKindLabel(kind)}
          </span>
        ) : null}
        {item.symbol ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Link
              href={item.symbolHref ?? symbolHubPath(item.symbol)}
              className="font-mono font-semibold text-accent-strong hover:underline"
            >
              {item.symbol}
            </Link>
            {item.portfolioWeightPct != null && item.portfolioWeightPct > 0 ? (
              <span className="tabular-nums text-muted">
                {item.portfolioWeightPct.toFixed(1)}% of portfolio
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex w-full min-w-0 max-w-full flex-col items-start gap-2">
          <NewsHeadlineClampedText
            href={item.url || null}
            slotClass={NEWS_HEADLINE_TITLE_SLOT}
            className="font-semibold leading-snug text-foreground group-hover:text-accent-strong"
          >
            {item.headline}
          </NewsHeadlineClampedText>
          {showSentiment ? (
            <span
              className={cn(
                "inline-flex max-w-full shrink-0 items-center px-2 py-0.5 text-[11px] font-medium",
                sentimentColor(sentiment),
              )}
            >
              {sentimentLabel(sentiment)}
            </span>
          ) : null}
        </div>

        <NewsHeadlineClampedText
          slotClass={NEWS_HEADLINE_SUMMARY_SLOT}
          className="leading-relaxed text-muted"
        >
          {item.summary || "\u00a0"}
        </NewsHeadlineClampedText>

        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          <time dateTime={item.datetime}>
            {new Date(item.datetime).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          {item.source ? <span className="truncate">{item.source}</span> : null}
          {(item.confidence ?? 0) > 0 ? (
            <span className="tabular-nums">
              {((item.confidence ?? 0) * 100).toFixed(0)}% conf.
            </span>
          ) : null}
        </div>

        {(item.topics?.length ?? 0) > 0 ? (
          <p className="line-clamp-1 max-w-full overflow-hidden break-words text-[11px] text-muted">
            {item.topics?.map((t) => t.replace(/_/g, " ")).join(" · ")}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group flex h-full min-h-0 min-w-0 max-w-full gap-3 overflow-hidden border border-border bg-background/60 p-3 transition-colors",
        "hover:border-accent/30 hover:bg-surface-elevated/50",
        view === "grid"
          ? "w-full flex-col items-stretch sm:flex-row sm:items-start @max-headlines/md:flex-col @max-headlines/md:items-stretch"
          : "w-full flex-row items-start",
      )}
    >
      {cardInner}
    </article>
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
  const isPositive = label === "Positive tone";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition",
        active
          ? isPositive
            ? "border-success/30 bg-success/10 text-success"
            : "border-accent/40 bg-accent-muted text-accent-strong"
          : "border-border bg-background text-muted hover:border-accent/30 hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums",
          active
            ? isPositive
              ? "text-success"
              : "text-accent-strong"
            : "text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function HeadlinesViewToggle({
  view,
  onChange,
  className,
}: {
  view: HeadlinesView;
  onChange: (view: HeadlinesView) => void;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(appTabBarClass, "shrink-0", className)}
      aria-label="Headlines layout"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={appTabLinkClass(view === "list")}
        aria-pressed={view === "list"}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
        List
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={appTabLinkClass(view === "grid")}
        aria-pressed={view === "grid"}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        Grid
      </button>
    </fieldset>
  );
}

export function NewsHeadlinesSkeleton({
  view,
  rows = 4,
  label = "Loading headlines",
}: {
  view: HeadlinesView;
  rows?: number;
  label?: string;
}) {
  const card = (
    <div className="flex gap-3 border border-border bg-background/40 p-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );

  return (
    <LoadingRegion label={label}>
      <LoadingStagger>
        {view === "grid" ? (
          <div className={NEWS_HEADLINES_GRID_CLASS}>
            {Array.from(
              { length: rows },
              (_, row) => `grid-${rows}-${row}`,
            ).map((key) => (
              <div key={key} className="min-h-0 min-w-0">
                {card}
              </div>
            ))}
          </div>
        ) : (
          <div className={NEWS_HEADLINES_LIST_CLASS}>
            {Array.from(
              { length: rows },
              (_, row) => `list-${rows}-${row}`,
            ).map((key) => (
              <div key={key} className="min-w-0">
                {card}
              </div>
            ))}
          </div>
        )}
      </LoadingStagger>
    </LoadingRegion>
  );
}

type NewsHeadlinesPanelProps = {
  items: NewsHeadlineDisplayItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  showSentimentFilters?: boolean;
  showSentiment?: boolean;
  showFeedKind?: boolean;
  defaultView?: HeadlinesView;
  emptyMessage?: string;
  itemLimit?: number;
  footer?: ReactNode;
  hideToolbar?: boolean;
  /** Hide list/grid toggle while keeping sentiment filters (e.g. All-tab preview). */
  hideViewToggle?: boolean;
};

export function NewsHeadlinesPanel({
  items,
  isLoading = false,
  isRefreshing = false,
  showSentimentFilters = true,
  showSentiment = true,
  showFeedKind = false,
  defaultView = "grid",
  emptyMessage = "No headlines in this batch.",
  itemLimit,
  footer,
  hideToolbar = false,
  hideViewToggle = false,
}: NewsHeadlinesPanelProps) {
  const [filter, setFilter] = useState<SentimentFilter>("all");
  const [headlinesView, setHeadlinesView] =
    useState<HeadlinesView>(defaultView);
  const layoutView: HeadlinesView = hideViewToggle ? "grid" : headlinesView;

  const counts = useMemo(() => countBySentiment(items), [items]);

  const filteredItems = useMemo(() => {
    if (!showSentimentFilters || filter === "all") return items;
    return items.filter((item) => (item.sentiment ?? "neutral") === filter);
  }, [filter, items, showSentimentFilters]);

  const visibleItems = useMemo(
    () =>
      itemLimit != null ? filteredItems.slice(0, itemLimit) : filteredItems,
    [filteredItems, itemLimit],
  );
  const hasSentimentSpread =
    showSentimentFilters &&
    (counts.bullish > 0 || counts.bearish > 0) &&
    items.length > 0;

  const panelBody = (
    <div className="app-stack min-w-0">
      {!hideToolbar ? (
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {hasSentimentSpread ? (
            <fieldset
              className="flex min-w-0 flex-wrap gap-1.5"
              aria-label="Filter by sentiment"
            >
              <FilterChip
                active={filter === "all"}
                label="All"
                count={items.length}
                onClick={() => setFilter("all")}
              />
              <FilterChip
                active={filter === "bullish"}
                label="Positive tone"
                count={counts.bullish}
                onClick={() => setFilter("bullish")}
              />
              <FilterChip
                active={filter === "neutral"}
                label="Mixed/Neutral tone"
                count={counts.neutral}
                onClick={() => setFilter("neutral")}
              />
              <FilterChip
                active={filter === "bearish"}
                label="Negative tone"
                count={counts.bearish}
                onClick={() => setFilter("bearish")}
              />
            </fieldset>
          ) : (
            <p className="text-[11px] text-muted">
              {items.length} headline{items.length === 1 ? "" : "s"}
            </p>
          )}
          {!hideViewToggle ? (
            <HeadlinesViewToggle
              view={headlinesView}
              onChange={setHeadlinesView}
              className="w-full shrink-0 sm:w-auto"
            />
          ) : null}
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div
          className={
            layoutView === "grid"
              ? NEWS_HEADLINES_GRID_CLASS
              : NEWS_HEADLINES_LIST_CLASS
          }
        >
          {visibleItems.map((item) => (
            <div key={item.id} className="min-h-0 min-w-0">
              <NewsHeadlineCard
                item={item}
                view={layoutView}
                showSentiment={showSentiment}
                showFeedKind={showFeedKind}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {filter === "all" || !showSentimentFilters
            ? emptyMessage
            : `No ${sentimentFilterLabel(filter)} headlines in this batch. Try another filter.`}
        </p>
      )}

      {footer ? <div className="pt-1">{footer}</div> : null}
    </div>
  );

  return (
    <LoadingSurface
      loading={isLoading}
      refreshing={isRefreshing}
      hasContent={items.length > 0}
      label="Loading headlines"
      className={NEWS_HEADLINES_PANEL_CONTAINER_CLASS}
      skeleton={<NewsHeadlinesSkeleton view={layoutView} />}
    >
      {panelBody}
    </LoadingSurface>
  );
}

export function countEnrichedBySentiment(items: EnrichedNewsItem[]) {
  return countBySentiment(items.map(enrichedNewsItemToDisplay));
}

export function SentimentMixBar({ items }: { items: EnrichedNewsItem[] }) {
  const counts = countEnrichedBySentiment(items);
  const total = items.length || 1;
  const segments: { key: Sentiment; count: number; className: string }[] = [
    { key: "bullish", count: counts.bullish, className: "bg-accent-strong" },
    { key: "neutral", count: counts.neutral, className: "bg-muted" },
    { key: "bearish", count: counts.bearish, className: "bg-danger" },
  ];

  return (
    <div
      role="img"
      className="flex flex-col gap-2"
      aria-label="Sentiment mix in recent headlines"
    >
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
