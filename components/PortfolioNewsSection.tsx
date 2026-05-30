"use client";

import { useMemo } from "react";
import { List, RefreshCw } from "lucide-react";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";
import {
  NewsHeadlinesPanel,
  portfolioNewsItemToDisplay,
} from "@/components/NewsHeadlinesFeed";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

type Props = {
  items: PortfolioHoldingsNewsItem[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  lastUpdated?: number | null;
  onRefresh?: () => void;
  className?: string;
};

export function PortfolioNewsSection({
  items,
  loading = false,
  refreshing = false,
  error = null,
  lastUpdated = null,
  onRefresh,
  className,
}: Props) {
  const displayItems = useMemo(
    () => items.map(portfolioNewsItemToDisplay),
    [items],
  );

  const refreshAction = onRefresh ? (
    <div className="flex shrink-0 items-center gap-2">
      <FreshnessLabel
        updatedAt={lastUpdated}
        pending={loading || refreshing}
        pendingLabel="Fetching headlines…"
        className="hidden sm:inline-flex"
      />
      <IconButton
        size="sm"
        onClick={onRefresh}
        disabled={loading || refreshing}
        aria-label="Refresh news"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", (loading || refreshing) && "animate-spin")}
          aria-hidden
        />
      </IconButton>
    </div>
  ) : null;

  return (
    <section className={cn("app-stack w-full", className)}>
      {error ? <ErrorBanner message={error} onRetry={onRefresh} /> : null}

      <ResearchSectionCard
        title="Headlines"
        description="Recent stories from your largest holdings"
        icon={List}
        action={refreshAction}
        bodyClassName="min-w-0"
      >
        <NewsHeadlinesPanel
          items={displayItems}
          isLoading={loading}
          isRefreshing={refreshing}
          showSentimentFilters={false}
          emptyMessage="No headlines available right now."
        />
      </ResearchSectionCard>
    </section>
  );
}
