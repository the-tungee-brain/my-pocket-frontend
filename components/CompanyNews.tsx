"use client";

import { StockNewsView } from "@/app/hooks/useCompanyNews";
import NewsAnalytics from "./NewsAnalytics";

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  symbol?: string;
};

export function CompanyNews({
  analytics,
  isLoading,
  error,
  onRetry,
  symbol,
}: Props) {
  if (!symbol) return null;

  const news = analytics?.items ?? [];

  const handleCardClick = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mt-6 flex justify-center">
      <div className="w-full max-w-3xl">
        {analytics && (
          <NewsAnalytics analytics={analytics} isLoading={isLoading} />
        )}

        <div className="mb-3 mt-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">
            Latest news for {symbol}
          </h2>
          {news.length > 0 && (
            <button
              onClick={onRetry}
              className="text-xs text-foreground/80 transition-all hover:text-foreground"
            >
              Refresh
            </button>
          )}
        </div>

        {isLoading && (
          <p className="text-xs text-gray-400 animate-pulse">
            Fetching today&apos;s headlines…
          </p>
        )}

        {!isLoading && error && (
          <div className="flex items-center justify-between text-xs text-red-400">
            <span>{error}</span>
            <button
              onClick={onRetry}
              className="ml-2 rounded border border-red-500 px-2 py-0.5 text-[11px] hover:bg-red-900/40"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && analytics && news.length === 0 && (
          <p className="text-xs text-gray-500">
            No news for {symbol} in the selected window.
          </p>
        )}

        {!isLoading && !error && analytics && news.length > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
            {news.map((n) => (
              <article
                key={n.id}
                onClick={() => handleCardClick(n.url)}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-secondary shadow-lg ring-1 ring-white/5 transition-shadow duration-150 hover:shadow-xl"
              >
                {n.image && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src={n.image}
                      alt={n.headline}
                      className="h-full w-full origin-center object-cover transition-transform duration-200 ease-out group-hover:scale-110"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold leading-snug text-gray-100 line-clamp-3 transition-colors duration-150 group-hover:text-white">
                    {n.headline}
                  </h3>

                  <div className="flex-1" />

                  <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[9px] font-semibold uppercase">
                        {n.source.slice(0, 2)}
                      </span>
                      <span className="ml-1">
                        {new Date(n.datetime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
