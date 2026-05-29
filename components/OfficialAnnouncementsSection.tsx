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
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";

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
  const { items, isLoading, error, lastUpdated, refetch } = usePressReleases(
    symbol,
    accessToken,
    { enabled: Boolean(symbol && accessToken) },
  );

  const displayItems = useMemo(
    () => items.map(pressReleaseToDisplay),
    [items],
  );

  const updatedLabel = lastUpdated
    ? formatRelativeUpdatedAt(lastUpdated)
    : null;

  const refreshAction = accessToken ? (
    <div className="flex shrink-0 items-center gap-2">
      {updatedLabel ? (
        <span className="hidden text-[11px] text-muted sm:inline">{updatedLabel}</span>
      ) : null}
      <IconButton
        size="sm"
        onClick={() => void refetch()}
        disabled={isLoading}
        aria-label="Refresh official announcements"
      >
        <RefreshCw
          className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
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
        showSentimentFilters={false}
        emptyMessage="No press releases available for this symbol right now."
      />
    </ResearchSectionCard>
  );
}
