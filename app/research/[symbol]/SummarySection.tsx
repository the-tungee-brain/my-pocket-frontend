"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, Info, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { overviewBundleEtagKey, writeOverviewBundleEtag } from "@/lib/overviewBundleCache";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { useSession } from "next-auth/react";
import { fetchResearchOverviewBundle } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  BigPictureArticle,
  BigPictureOverviewSkeleton,
} from "@/components/BigPictureArticle";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  cachedResearchToStockSummary,
  hasCachedResearchContent,
} from "@/lib/cachedResearchSummary";

type SummarySectionProps = {
  symbol: string;
  className?: string;
};

export function SummarySection({ symbol, className }: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const symbolUpper = symbol.toUpperCase();
  const [requestFullSummary, setRequestFullSummary] = useState(false);
  const { intelligence } = useSymbolIntelligence(symbol, {
    accessToken,
    includeOptions: false,
  });

  const cachedSummary = useMemo(() => {
    const cached = intelligence?.cachedResearch;
    if (!hasCachedResearchContent(cached) || !cached) return null;
    return cachedResearchToStockSummary(cached);
  }, [intelligence?.cachedResearch]);

  const queryClient = useQueryClient();
  const fullSummaryQueryKey = [
    "research-overview",
    symbolUpper,
    accessToken ?? "",
    "with-summary",
  ] as const;

  const fullSummaryQuery = useQuery({
    queryKey: fullSummaryQueryKey,
    queryFn: async () => {
      const result = await fetchResearchOverviewBundle(
        accessToken!,
        symbolUpper,
        { includeSummary: true },
      );
      if (result.status === "ok") {
        return result.bundle;
      }

      const cached =
        queryClient.getQueryData<ResearchOverviewBundle>(fullSummaryQueryKey);
      if (cached) {
        return cached;
      }

      writeOverviewBundleEtag(overviewBundleEtagKey(symbolUpper, true), null);
      const retry = await fetchResearchOverviewBundle(
        accessToken!,
        symbolUpper,
        { includeSummary: true, skipEtag: true },
      );
      if (retry.status !== "ok") {
        throw new Error("Failed to load full research summary");
      }
      return retry.bundle;
    },
    enabled: Boolean(requestFullSummary && accessToken && symbolUpper),
    staleTime: 10 * 60_000,
  });

  const summary = requestFullSummary
    ? (fullSummaryQuery.data?.summary ?? null)
    : cachedSummary;
  const loading =
    requestFullSummary && fullSummaryQuery.isLoading && !summary;

  const loadFullSummary = useCallback(() => {
    setRequestFullSummary(true);
  }, []);

  const sectionMeta = {
    title: "Big picture",
    description: requestFullSummary
      ? "AI overview — thesis, valuation, strengths, and risks"
      : "Research snapshot — expand for a fresh AI deep dive",
    icon: Info,
  };

  if (loading && !summary) {
    return (
      <ResearchSectionCard className={className} {...sectionMeta}>
        <BigPictureOverviewSkeleton />
      </ResearchSectionCard>
    );
  }

  if (requestFullSummary && fullSummaryQuery.isError && !summary) {
    return (
      <div className={className}>
        <ErrorBanner message="Could not load AI overview." />
      </div>
    );
  }

  if (!summary) {
    return (
      <ResearchSectionCard className={className} {...sectionMeta}>
        <EmptyState
          icon={FileText}
          title="Summary unavailable"
          description={`We don't have a summary for ${symbolUpper} right now.`}
          variant="solid"
          className="py-4"
        />
        {accessToken ? (
          <button
            type="button"
            onClick={loadFullSummary}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Generate AI overview
          </button>
        ) : null}
      </ResearchSectionCard>
    );
  }

  return (
    <>
      {!requestFullSummary && accessToken ? (
        <div className={className}>
          <button
            type="button"
            onClick={loadFullSummary}
            disabled={fullSummaryQuery.isFetching}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-60"
          >
            <RefreshCw
              className={cn(
                "h-3 w-3",
                fullSummaryQuery.isFetching && "animate-spin",
              )}
              aria-hidden
            />
            Refresh with full AI analysis
          </button>
        </div>
      ) : null}
      <BigPictureArticle
        summary={summary}
        symbol={symbolUpper}
        className={className}
      />
    </>
  );
}
