"use client";

import { Newspaper } from "lucide-react";
import { StockNewsView } from "@/app/hooks/useCompanyNews";
import NewsAnalytics from "./NewsAnalytics";
import { ErrorBanner } from "./ui/ErrorBanner";
import { EmptyState } from "./ui/EmptyState";
import { cn } from "@/lib/utils";

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: number | null;
  onRetry: () => void;
  onRefresh?: () => void;
  symbol?: string;
  className?: string;
};

export function CompanyNews({
  analytics,
  isLoading,
  error,
  lastUpdated = null,
  onRetry,
  onRefresh,
  symbol,
  className,
}: Props) {
  return (
    <section className={cn("w-full space-y-4", className)}>
      {error && !isLoading ? (
        <ErrorBanner message={error} onRetry={onRetry} />
      ) : null}

      {!error && (analytics || isLoading) ? (
        <NewsAnalytics
          analytics={analytics}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
        />
      ) : null}

      {!error && !isLoading && !analytics ? (
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
      ) : null}
    </section>
  );
}
