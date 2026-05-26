"use client";

import { Newspaper } from "lucide-react";
import { StockNewsView } from "@/app/hooks/useCompanyNews";
import NewsAnalytics from "./NewsAnalytics";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { ErrorBanner } from "./ui/ErrorBanner";
import { EmptyState } from "./ui/EmptyState";

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: number | null;
  onRetry: () => void;
  onRefresh?: () => void;
  symbol?: string;
};

export function CompanyNews({
  analytics,
  isLoading,
  error,
  lastUpdated = null,
  onRetry,
  onRefresh,
  symbol,
}: Props) {
  return (
    <section className="w-full">
        {isLoading && (
          <ThinkingSpinner message="Fetching and analyzing news" />
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-border bg-secondary/60 px-4 py-6">
            <ErrorBanner message={error} onRetry={onRetry} />
          </div>
        )}

        {!error && analytics && (
          <NewsAnalytics
            analytics={analytics}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
            onRefresh={onRefresh}
          />
        )}

        {!error && !isLoading && !analytics && (
          <EmptyState
            icon={Newspaper}
            title="No news yet"
            description={
              symbol
                ? `We couldn't find recent news analysis for ${symbol} right now.`
                : "No news analysis is available for this symbol right now."
            }
            variant="solid"
          />
        )}
    </section>
  );
}
