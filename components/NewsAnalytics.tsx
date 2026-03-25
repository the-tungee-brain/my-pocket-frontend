"use client";

import type {
  StockNewsView,
  Sentiment,
  OverallSentiment,
} from "@/app/hooks/useCompanyNews";

function sentimentColor(sentiment: Sentiment) {
  switch (sentiment) {
    case "bullish":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40";
    case "bearish":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40";
    case "neutral":
    default:
      return "bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/40";
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
      return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/50";
    case "bullish":
      return "bg-emerald-500/10 text-emerald-200 border border-emerald-500/40";
    case "neutral":
      return "bg-slate-600/40 text-slate-100 border border-slate-500/40";
    case "bearish":
      return "bg-rose-500/10 text-rose-200 border border-rose-500/40";
    case "strongly_bearish":
      return "bg-rose-500/20 text-rose-100 border border-rose-500/60";
  }
}

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
};

export default function NewsAnalytics({ analytics, isLoading }: Props) {
  const data = analytics;

  if (!data && !isLoading) return null;

  const sentimentClass = data
    ? overallSentimentColor(data.overall_sentiment)
    : "bg-slate-700/40 text-slate-200 border border-slate-600/40";
  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <div
        className={`w-full rounded-xl px-4 py-3 text-sm shadow-sm backdrop-blur ${sentimentClass}`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-black/20 px-2 text-xs font-medium uppercase tracking-wide text-white/80">
              News Sentiment
            </span>
            <span className="inline-flex items-center rounded-full bg-black/30 px-2 py-1 text-xs font-semibold">
              {data
                ? overallSentimentLabel(data.overall_sentiment)
                : "Loading…"}
            </span>
          </div>
          <span className="text-[11px] text-white/60">
            {isLoading ? "Updating…" : "Updated a few minutes ago"}
          </span>
        </div>

        <p className="mb-3 text-sm text-white/90">
          {data ? (
            data.summary
          ) : (
            <span className="inline-block h-4 w-3/4 animate-pulse rounded bg-white/10" />
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          {data
            ? data.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-white/80"
                >
                  <span className="mt-0.75 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>{insight}</span>
                </div>
              ))
            : isLoading && (
                <>
                  <div className="h-6 w-40 animate-pulse rounded bg-black/20" />
                  <div className="h-6 w-52 animate-pulse rounded bg-black/20" />
                </>
              )}
        </div>

        {data && data.risks.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-2">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-rose-200/80">
              Risks
            </div>
            <div className="flex flex-wrap gap-2">
              {data.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
                >
                  <span className="mt-0.75 inline-block h-1.5 w-1.5 rounded-full bg-rose-300" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between border-b border-neutral-800 py-2">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Recent news flow
          </div>
          <div className="text-[11px] text-neutral-500">
            {data ? `${data.items.length} articles analyzed` : "Loading…"}
          </div>
        </div>

        <ul className="divide-y divide-neutral-800">
          {data &&
            data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-3 text-sm text-neutral-100 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-neutral-50 underline-offset-2 hover:text-white hover:underline"
                      >
                        {item.headline}
                      </a>
                    ) : (
                      <span className="font-medium text-neutral-50">
                        {item.headline}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${sentimentColor(
                        item.sentiment,
                      )}`}
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

                  <p className="mb-1 text-[13px] text-neutral-300">
                    {item.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-neutral-500">
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
                          className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-px text-[11px] text-neutral-300"
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
            <li className="flex flex-col gap-2 px-4 py-3 text-sm text-neutral-400">
              <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
