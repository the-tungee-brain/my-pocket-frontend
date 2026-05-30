"use client";

import { useMemo } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { usePressReleases } from "@/app/hooks/usePressReleases";
import {
  NewsHeadlinesPanel,
  pressReleaseToDisplay,
} from "@/components/NewsHeadlinesFeed";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";

type Props = {
  symbol: string;
  accessToken?: string;
  className?: string;
};

export function OfficialAnnouncementsSection({
  symbol,
  accessToken,
  className,
}: Props) {
  const { items, isLoading, isRefreshing, error, lastUpdated, refetch } = usePressReleases(
    symbol,
    accessToken,
    { enabled: Boolean(symbol && accessToken) },
  );

  const displayItems = useMemo(
    () => items.map(pressReleaseToDisplay),
    [items],
  );

  const refreshAction = accessToken ? (
    <div className="flex shrink-0 items-center gap-2">
      <FreshnessLabel
        updatedAt={lastUpdated}
        pending={isLoading || isRefreshing}
        className="hidden sm:inline-flex"
      />
      <IconButton
        size="sm"
        onClick={() => void refetch()}
        disabled={isLoading || isRefreshing}
        aria-label="Refresh official announcements"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", (isLoading || isRefreshing) && "animate-spin")}
          aria-hidden
        />
      </IconButton>
    </div>
  ) : null;

  if (!accessToken) return null;

  return (
    <ResearchSectionCard
      className={className}
      bodyClassName="min-w-0"
      title="Official announcements"
      description="Company-issued press releases and IR announcements"
      icon={FileText}
      action={refreshAction}
    >
      {error ? (
        <ErrorBanner message={error} onRetry={() => void refetch()} />
      ) : null}
      <NewsHeadlinesPanel
        items={displayItems}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        showSentimentFilters={false}
        emptyMessage="No press releases available for this symbol right now."
      />
    </ResearchSectionCard>
  );
}
