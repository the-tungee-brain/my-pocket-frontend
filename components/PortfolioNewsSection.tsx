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
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";

type Props = {
  items: PortfolioHoldingsNewsItem[];
  loading?: boolean;
  error?: string | null;
  lastUpdated?: number | null;
  onRefresh?: () => void;
  className?: string;
};

export function PortfolioNewsSection({
  items,
  loading = false,
  error = null,
  lastUpdated = null,
  onRefresh,
  className,
}: Props) {
  const displayItems = useMemo(
    () => items.map(portfolioNewsItemToDisplay),
    [items],
  );

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  const refreshAction = onRefresh ? (
    <div className="flex shrink-0 items-center gap-2">
      {updatedLabel ? (
        <span className="hidden text-[11px] text-muted sm:inline">{updatedLabel}</span>
      ) : null}
      <IconButton
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh news"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", loading && "animate-spin")}
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
          showSentimentFilters={false}
          emptyMessage="No headlines available right now."
        />
      </ResearchSectionCard>
    </section>
  );
}
