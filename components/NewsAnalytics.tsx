"use client";

import type {
  StockNewsView,
  Sentiment,
  OverallSentiment,
} from "@/app/hooks/useCompanyNews";
import { cn } from "@/lib/utils";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";

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

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  lastUpdated?: number | null;
};

export default function NewsAnalytics({
  analytics,
  isLoading,
  lastUpdated = null,
}: Props) {
  const data = analytics;

  if (!data && !isLoading) return null;

  const sentimentClass = data
    ? overallSentimentColor(data.overall_sentiment)
    : "border border-border bg-muted-bg text-foreground";
  const actionabilityScore = data?.actionability_score ?? null;
  const actionabilityPercent =
    actionabilityScore == null
      ? 0
      : Math.max(0, Math.min(100, (actionabilityScore / 5) * 100));

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <div
        className={cn(
          "w-full rounded-xl px-4 py-3 text-sm shadow-sm",
          sentimentClass,
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-background/40 px-2 text-xs font-medium uppercase tracking-wide text-muted">
              News Sentiment
            </span>
            <span className="inline-flex items-center rounded-full bg-background/50 px-2 py-1 text-xs font-semibold text-foreground">
              {data
                ? overallSentimentLabel(data.overall_sentiment)
                : "Loading…"}
            </span>
          </div>
          <span className="text-[11px] text-muted">
            {isLoading
              ? updatedLabel
                ? `${updatedLabel} · Updating…`
                : "Updating…"
              : updatedLabel}
          </span>
        </div>

        <p className="mb-3 text-sm text-foreground">
          {data ? (
            data.summary
          ) : (
            <span className="inline-block h-4 w-3/4 animate-pulse rounded bg-muted-bg" />
          )}
        </p>

        {data?.investorTakeaway && (
          <div className="mb-3 rounded-lg border border-border bg-background/40 px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
              Investor takeaway
            </div>
            <p className="text-sm text-foreground">{data.investorTakeaway}</p>
          </div>
        )}

        {data?.deepAnalysis && (
          <div className="mb-3 rounded-lg bg-background/30 px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Deep analysis
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {data.deepAnalysis}
            </p>
          </div>
        )}

        <div className="mb-3 grid gap-2 border-y border-border py-3 sm:grid-cols-3">
          <div className="rounded-lg bg-background/30 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Dominant driver
            </div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {data
                ? formatMetadataValue(data.dominant_driver)
                : "Loading..."}
            </div>
          </div>

          <div className="rounded-lg bg-background/30 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Impact horizon
            </div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {data
                ? formatMetadataValue(data.market_impact_horizon)
                : "Loading..."}
            </div>
          </div>

          <div className="rounded-lg bg-background/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Actionability
              </div>
              <div
                className={cn(
                  "text-xs font-semibold",
                  actionabilityTone(actionabilityScore),
                )}
              >
                {actionabilityScore == null ? "N/A" : actionabilityScore}
              </div>
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

        <div className="flex flex-wrap gap-2">
          {data
            ? data.insights.map((insight) => (
                <div
                  key={insight}
                  className="flex items-start gap-2 rounded-lg bg-background/30 px-3 py-2 text-xs text-foreground"
                >
                  <span className="mt-0.75 inline-block h-1.5 w-1.5 rounded-full bg-accent-strong" />
                  <span>{insight}</span>
                </div>
              ))
            : isLoading && (
                <>
                  <div className="h-6 w-40 animate-pulse rounded bg-muted-bg" />
                  <div className="h-6 w-52 animate-pulse rounded bg-muted-bg" />
                </>
              )}
        </div>

        {data && data.risks.length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-danger">
              Risks
            </div>
            <div className="flex flex-wrap gap-2">
              {data.risks.map((risk) => (
                <div
                  key={risk}
                  className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"
                >
                  <span className="mt-0.75 inline-block h-1.5 w-1.5 rounded-full bg-danger" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between border-b border-border py-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Recent news flow
          </div>
          <div className="text-[11px] text-muted">
            {data ? `${data.items.length} articles analyzed` : "Loading…"}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {data &&
            data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-3 text-sm text-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground underline-offset-2 hover:text-accent-strong hover:underline"
                      >
                        {item.headline}
                      </a>
                    ) : (
                      <span className="font-medium text-foreground">
                        {item.headline}
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        sentimentColor(item.sentiment),
                      )}
                    >
                      {item.sentiment === "bullish"
                        ? "Bullish"
                        : item.sentiment === "bearish"
                          ? "Bearish"
                          : "Neutral"}
                      <span className="ml-1 text-[10px] opacity-70">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>

                  <p className="mb-1 text-[13px] text-muted">{item.summary}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted">
                      {new Date(item.datetime).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {item.source}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center rounded-full bg-muted-bg px-2 py-px text-[11px] text-muted"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}

          {!data && isLoading && (
            <li className="flex flex-col gap-2 px-4 py-3 text-sm text-muted">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted-bg" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted-bg" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted-bg" />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
